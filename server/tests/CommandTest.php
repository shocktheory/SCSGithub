<?php
declare(strict_types=1);

namespace Scs\Tests;

use PHPUnit\Framework\TestCase;
use Scs\Config;
use Scs\Database;
use Scs\Repository;
use Scs\Commands;
use Scs\Auth;
use Scs\Derivation;
use Slim\Psr7\Response;

/**
 * Phase 7 — Governed command architecture + state transition engine, against REAL MySQL.
 * Covers the full vocabulary (propose/approve/accept/activate/reject/supersede/archive/restore/
 * retire) and the MANDATORY regressions (unauthorized command, invalid transition, concurrency
 * conflict, duplicate command, client authority mutation, drift/replay).
 * Skipped automatically when no database connection is available.
 */
final class CommandTest extends TestCase
{
    private Repository $repo;
    private Auth $auth;
    private Commands $cmd;

    protected function setUp(): void
    {
        $config = Config::fromEnv();
        try {
            $db = new Database($config);
            $db->pdo();
        } catch (\Throwable $e) {
            $this->markTestSkipped('no MySQL connection: ' . $e->getMessage());
        }
        $this->repo = new Repository($db);
        $this->repo->resetAll();
        $this->auth = new Auth($db);
        $this->cmd = new Commands($this->repo, $this->auth);
    }

    private function po(): array { return ['id' => 'po', 'role' => 'product_owner', 'mfaVerified' => true, 'mfaFresh' => true]; }
    private function admin(): array { return ['id' => 'adm', 'role' => 'administrator']; }
    private function agent(): array { return ['id' => 'ag', 'role' => 'agent']; }

    private function base(string $id = 'p1'): void
    {
        $this->repo->upsert('products', ['id' => $id, 'name' => 'A', 'authorityStatus' => 'reported']);
    }
    private function call(string $command, array $body, ?array $actor): Response
    {
        return $this->cmd->handle($command, $body, new Response(), $actor, 'req');
    }
    private function stateOf(string $id): string
    {
        return \Scs\StateMachine::stateOf($this->repo->getAny('products', $id)['record']);
    }

    // ---- Full governed lifecycle (happy path) ----------------------------------------------
    public function testFullLifecycleProposeApproveAcceptActivate(): void
    {
        $r = $this->call('propose', ['collection' => 'products', 'record' => ['id' => 'p1', 'name' => 'A']], $this->agent());
        $this->assertSame(200, $r->getStatusCode());
        $this->assertSame('reported', $this->stateOf('p1'));

        $this->assertSame(200, $this->call('approve', ['collection' => 'products', 'id' => 'p1'], $this->po())->getStatusCode());
        $this->assertSame('approved', $this->stateOf('p1'));

        $this->assertSame(200, $this->call('accept', ['collection' => 'products', 'id' => 'p1'], $this->po())->getStatusCode());
        $this->assertSame('accepted', $this->stateOf('p1'));

        $this->assertSame(200, $this->call('activate', ['collection' => 'products', 'id' => 'p1'], $this->po())->getStatusCode());
        $this->assertSame('activated', $this->stateOf('p1'));
    }

    // ---- Lifecycle: reject / supersede / archive / restore / retire -------------------------
    public function testRejectProposed(): void
    {
        $this->base();
        $r = $this->call('reject', ['collection' => 'products', 'id' => 'p1', 'reason' => 'insufficient'], $this->po());
        $this->assertSame(200, $r->getStatusCode());
        $this->assertSame('rejected', $this->stateOf('p1'));
        // Approving a rejected record is a prohibited transition.
        $this->assertSame(422, $this->call('approve', ['collection' => 'products', 'id' => 'p1'], $this->po())->getStatusCode());
    }

    public function testSupersedeRequiresApprovedAndIsPoOnly(): void
    {
        $this->base();
        $this->call('approve', ['collection' => 'products', 'id' => 'p1'], $this->po());
        $this->assertSame(403, $this->call('supersede', ['collection' => 'products', 'id' => 'p1'], $this->agent())->getStatusCode());
        $this->assertSame(200, $this->call('supersede', ['collection' => 'products', 'id' => 'p1', 'supersededBy' => 'p2'], $this->po())->getStatusCode());
        $this->assertSame('superseded', $this->stateOf('p1'));
    }

    public function testArchiveRestoreRetire(): void
    {
        $this->base();
        // Agent cannot archive (admin command).
        $this->assertSame(403, $this->call('archive', ['collection' => 'products', 'id' => 'p1'], $this->agent())->getStatusCode());
        // Admin archives → hidden from get(), still present via getAny().
        $this->assertSame(200, $this->call('archive', ['collection' => 'products', 'id' => 'p1'], $this->admin())->getStatusCode());
        $this->assertNull($this->repo->get('products', 'p1'));
        $this->assertNotNull($this->repo->getAny('products', 'p1'));
        // Restore brings it back.
        $this->assertSame(200, $this->call('restore', ['collection' => 'products', 'id' => 'p1'], $this->admin())->getStatusCode());
        $this->assertNotNull($this->repo->get('products', 'p1'));
        // Archive then retire.
        $this->call('archive', ['collection' => 'products', 'id' => 'p1'], $this->admin());
        $this->assertSame(200, $this->call('retire', ['collection' => 'products', 'id' => 'p1'], $this->po())->getStatusCode());
        $this->assertSame('retired', $this->stateOf('p1'));
    }

    // ---- MANDATORY regressions -------------------------------------------------------------
    public function testUnauthorizedCommandDenied(): void
    {
        $this->base();
        $this->assertSame(403, $this->call('approve', ['collection' => 'products', 'id' => 'p1'], $this->agent())->getStatusCode());
        $this->assertSame(403, $this->call('approve', ['collection' => 'products', 'id' => 'p1'], $this->admin())->getStatusCode());
        $this->assertSame(401, $this->call('approve', ['collection' => 'products', 'id' => 'p1'], null)->getStatusCode());
    }

    public function testInvalidTransitionRejectedPredictably(): void
    {
        $this->base(); // state 'reported'
        // accept requires 'approved'; activate requires approved/accepted. Both prohibited from 'reported'.
        $this->assertSame(422, $this->call('accept', ['collection' => 'products', 'id' => 'p1'], $this->po())->getStatusCode());
        $this->assertSame(422, $this->call('activate', ['collection' => 'products', 'id' => 'p1'], $this->po())->getStatusCode());
    }

    public function testDuplicateCommandDoesNotDoubleApply(): void
    {
        $this->base();
        $this->assertSame(200, $this->call('approve', ['collection' => 'products', 'id' => 'p1'], $this->po())->getStatusCode());
        // Re-issuing approve from 'approved' is a prohibited transition (not a silent re-apply).
        $this->assertSame(422, $this->call('approve', ['collection' => 'products', 'id' => 'p1'], $this->po())->getStatusCode());
    }

    public function testConcurrencyConflict(): void
    {
        $this->base(); // version 1
        $r = $this->call('approve', ['collection' => 'products', 'id' => 'p1', 'expectedVersion' => 99], $this->po());
        $this->assertSame(409, $r->getStatusCode());
    }

    public function testIdempotentTransitionReplaysNotReapplies(): void
    {
        $this->base();
        $a = $this->call('approve', ['collection' => 'products', 'id' => 'p1', 'idempotencyKey' => 'k1'], $this->po());
        $b = $this->call('approve', ['collection' => 'products', 'id' => 'p1', 'idempotencyKey' => 'k1'], $this->po());
        $this->assertSame(200, $a->getStatusCode());
        $this->assertSame(200, $b->getStatusCode(), 'same idempotency key replays the stored result');
    }

    public function testClientAuthorityMutationViaWriteRejected(): void
    {
        // The approval boundary: neither an agent nor the Product Owner may elevate via propose/upsert.
        $this->assertSame(403, $this->call('propose', ['collection' => 'products', 'record' => ['id' => 'x', 'authorityStatus' => 'approved']], $this->agent())->getStatusCode());
        $this->assertSame(403, $this->call('upsert', ['collection' => 'products', 'record' => ['id' => 'y', 'authorityStatus' => 'accepted']], $this->po())->getStatusCode());
    }

    public function testMissingRecordIsNotFoundAfterAuthorization(): void
    {
        $this->assertSame(404, $this->call('approve', ['collection' => 'products', 'id' => 'ghost'], $this->po())->getStatusCode());
    }

    // ---- Replay / drift (deterministic reproduction of a stored derivation) -----------------
    public function testReplayReproducesStoredDerivation(): void
    {
        $d = new Derivation();
        $input = ['agentName' => '#X', 'standingDirective' => ['id' => 'ST-SD-005', 'version' => 'v1', 'status' => 'Current'],
                  'productOwnerAuthority' => ['id' => 'd', 'approved' => true], 'activationEventIds' => ['e'],
                  'teamMembership' => ['label' => 'TEAM-001 — Active', 'active' => true]];
        $out = $d->deriveAgentState($input);
        $hash = $d->inputHash($input);
        $this->repo->saveDerivation('agent-state', $hash, $d->derivationVersion(), $d->schemaVersion(), $out);
        $stored = $this->repo->getDerivation('agent-state', $hash, $d->derivationVersion());
        $this->assertNotNull($stored);
        $recomputed = $d->deriveAgentState($input);
        $this->assertSame(
            Derivation::canonicalize($stored['output']),
            Derivation::canonicalize($recomputed),
            'replay must reproduce the stored constitutional state exactly (no drift)'
        );
    }
}
