<?php
declare(strict_types=1);

namespace Scs\Tests;

use PHPUnit\Framework\TestCase;
use Scs\Config;
use Scs\Database;
use Scs\Repository;
use Scs\Commands;
use Scs\Auth;
use Scs\Audit;
use Scs\Derivation;
use Scs\StateMachine;
use Slim\Psr7\Response;

/**
 * Phase 8 — Constitutional Observability against REAL MySQL: Technical Audit Log (append-only,
 * hash-chain, tamper-evident, attributable), Constitutional Evidence (immutable once accepted),
 * governance visibility (derived, read-only), and the MANDATORY regressions.
 * Skipped automatically when no database connection is available.
 */
final class ObservabilityTest extends TestCase
{
    private Database $db;
    private Repository $repo;
    private Auth $auth;
    private Audit $audit;
    private Commands $cmd;

    protected function setUp(): void
    {
        $config = Config::fromEnv();
        try {
            $this->db = new Database($config);
            $this->db->pdo();
        } catch (\Throwable $e) {
            $this->markTestSkipped('no MySQL connection: ' . $e->getMessage());
        }
        $this->repo = new Repository($this->db);
        $this->repo->resetAll();
        $this->db->pdo()->exec('DELETE FROM audit_log');
        $this->auth = new Auth($this->db);
        $this->audit = new Audit($this->db);
        $this->cmd = new Commands($this->repo, $this->auth, $this->audit);
    }

    private function po(): array { return ['id' => 'po', 'role' => 'product_owner', 'mfaVerified' => true, 'mfaFresh' => true]; }
    private function admin(): array { return ['id' => 'adm', 'role' => 'administrator']; }
    private function agent(): array { return ['id' => 'ag', 'role' => 'agent']; }
    private function call(string $c, array $b, ?array $a): Response { return $this->cmd->handle($c, $b, new Response(), $a, 'req'); }
    private function base(string $col = 'products', string $id = 'p1'): void { $this->repo->upsert($col, ['id' => $id, 'name' => 'A', 'authorityStatus' => 'reported']); }

    // ---- Technical Audit Log --------------------------------------------------------------
    public function testAppliedCommandIsAudited(): void
    {
        $this->base();
        $before = $this->audit->count();
        $this->assertSame(200, $this->call('approve', ['collection' => 'products', 'id' => 'p1'], $this->po())->getStatusCode());
        $this->assertGreaterThan($before, $this->audit->count());
        $events = $this->audit->list();
        $last = end($events);
        $this->assertSame('applied', $last['outcome']);
        $this->assertSame('po', $last['actor_id']);
        $this->assertStringContainsString('approve', $last['event_type']);
    }

    public function testRejectedCommandIsAuditedAndAttributed(): void
    {
        $this->base();
        $this->assertSame(403, $this->call('approve', ['collection' => 'products', 'id' => 'p1'], $this->agent())->getStatusCode());
        $rejected = array_values(array_filter($this->audit->list(), static fn($e) => $e['outcome'] === 'rejected'));
        $this->assertNotEmpty($rejected, 'a rejected command must remain attributable in the audit log');
        $this->assertSame('ag', end($rejected)['actor_id']);
    }

    public function testAuditHashChainIsIntact(): void
    {
        $this->base();
        $this->call('approve', ['collection' => 'products', 'id' => 'p1'], $this->po());
        $this->call('accept', ['collection' => 'products', 'id' => 'p1'], $this->po());
        $this->call('activate', ['collection' => 'products', 'id' => 'p1'], $this->po());
        $v = $this->audit->verifyIntegrity();
        $this->assertTrue($v['ok'], 'append-only hash-chain must verify');
        $this->assertNull($v['brokenAt']);
        $this->assertGreaterThanOrEqual(3, $v['count']);
    }

    public function testAuditTamperIsDetected(): void
    {
        $this->base();
        $this->call('approve', ['collection' => 'products', 'id' => 'p1'], $this->po());
        $this->assertTrue($this->audit->verifyIntegrity()['ok']);
        // Simulate an attacker mutating a recorded event in place (the app itself never does this).
        $this->db->pdo()->exec("UPDATE audit_log SET reason = 'tampered' ORDER BY seq DESC LIMIT 1");
        $v = $this->audit->verifyIntegrity();
        $this->assertFalse($v['ok'], 'tampering must break the hash-chain');
        $this->assertNotNull($v['brokenAt']);
    }

    public function testAuditIsAppendOnlyMonotonic(): void
    {
        $this->base();
        $c0 = $this->audit->count();
        $this->call('approve', ['collection' => 'products', 'id' => 'p1'], $this->po());
        $c1 = $this->audit->count();
        $this->call('accept', ['collection' => 'products', 'id' => 'p1'], $this->po());
        $c2 = $this->audit->count();
        $this->assertGreaterThan($c0, $c1);
        $this->assertGreaterThan($c1, $c2);
    }

    // ---- Operational History vs Technical Audit (distinct, never duplicated) ---------------
    public function testCommandAuditedButOperationalHistoryUnchanged(): void
    {
        $this->base();
        $ohBefore = (int)$this->db->pdo()->query('SELECT COUNT(*) FROM operational_history')->fetchColumn();
        $this->call('approve', ['collection' => 'products', 'id' => 'p1'], $this->po());
        $ohAfter = (int)$this->db->pdo()->query('SELECT COUNT(*) FROM operational_history')->fetchColumn();
        $this->assertSame($ohBefore, $ohAfter, 'technical command execution must not write Operational History (distinct systems)');
        $this->assertGreaterThan(0, $this->audit->count());
    }

    // ---- Constitutional Evidence (immutable once accepted; governed lifecycle) --------------
    public function testEvidenceIsImmutableOnceAccepted(): void
    {
        $this->assertSame(200, $this->call('propose', ['collection' => 'evidence', 'record' => ['id' => 'ev1', 'kind' => 'test', 'summary' => 'ci green']], $this->agent())->getStatusCode());
        $this->assertSame(200, $this->call('approve', ['collection' => 'evidence', 'id' => 'ev1'], $this->po())->getStatusCode());
        $this->assertSame(200, $this->call('accept', ['collection' => 'evidence', 'id' => 'ev1'], $this->po())->getStatusCode());
        // Immutable once accepted — a plain write is refused; it must be superseded by a command.
        $r = $this->call('propose', ['collection' => 'evidence', 'record' => ['id' => 'ev1', 'summary' => 'altered']], $this->agent());
        $this->assertSame(403, $r->getStatusCode(), 'accepted evidence must be immutable via write');
        // Supersession is a governed command (allowed).
        $this->assertSame(200, $this->call('supersede', ['collection' => 'evidence', 'id' => 'ev1', 'supersededBy' => 'ev2'], $this->po())->getStatusCode());
        $this->assertSame('superseded', StateMachine::stateOf($this->repo->getAny('evidence', 'ev1')['record']));
    }

    public function testEvidenceCannotBecomeAuthorityViaWrite(): void
    {
        // Evidence supports decisions but never becomes authority — cannot self-elevate.
        $r = $this->call('propose', ['collection' => 'evidence', 'record' => ['id' => 'evx', 'authorityStatus' => 'approved']], $this->agent());
        $this->assertSame(403, $r->getStatusCode());
    }

    // ---- Governance Visibility (derived, read-only) ----------------------------------------
    public function testGovernanceVisibilityIsDerivedReadOnly(): void
    {
        $this->base('gates', 'g1');
        $this->repo->upsert('gates', ['id' => 'g1', 'name' => 'Review', 'status' => 'Open — pending Product Owner review']);
        $this->repo->upsert('deliverables', ['id' => 'd1', 'deliverableId' => 'ST-DLV-X', 'status' => 'In review']);
        $verBefore = $this->repo->getAny('deliverables', 'd1')['version'];

        $derive = new Derivation();
        $collections = [];
        foreach (['aiCollaborators','decisions','standingDirectives','assignmentDirectives','operationalHistory','teams','teamMemberships','deliverables','gates','evidence'] as $c) {
            $collections[$c] = array_map(static fn($r) => $r['record'], $this->repo->list($c));
        }
        $gov = $derive->deriveGovernance($collections);
        $this->assertTrue($gov['readOnly']);
        $this->assertSame('server', $gov['source']);
        $this->assertSame(1, $gov['approvalQueue']['deliverablesInReview']);
        $this->assertGreaterThanOrEqual(1, $gov['reviewQueue']['open']);
        // Deriving governance must not mutate any record.
        $this->assertSame($verBefore, $this->repo->getAny('deliverables', 'd1')['version'], 'governance visibility must be read-only');
    }

    // ---- MANDATORY regressions -------------------------------------------------------------
    public function testAdministratorCannotGainConstitutionalAuthority(): void
    {
        $this->base();
        $this->assertSame(403, $this->call('approve', ['collection' => 'products', 'id' => 'p1'], $this->admin())->getStatusCode());
        $this->assertSame(403, $this->call('accept', ['collection' => 'products', 'id' => 'p1'], $this->admin())->getStatusCode());
    }

    public function testEvidenceMutationAfterAcceptanceRejected(): void
    {
        $this->call('propose', ['collection' => 'evidence', 'record' => ['id' => 'evm', 'summary' => 's']], $this->po());
        $this->call('approve', ['collection' => 'evidence', 'id' => 'evm'], $this->po());
        $this->call('accept', ['collection' => 'evidence', 'id' => 'evm'], $this->po());
        $this->assertSame(403, $this->call('upsert', ['collection' => 'evidence', 'record' => ['id' => 'evm', 'summary' => 'changed']], $this->po())->getStatusCode());
    }
}
