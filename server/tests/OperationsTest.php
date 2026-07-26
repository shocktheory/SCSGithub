<?php
declare(strict_types=1);

namespace Scs\Tests;

use PHPUnit\Framework\TestCase;
use Scs\Config;
use Scs\Database;
use Scs\Repository;
use Scs\Operations;
use Scs\Notifications;
use Scs\StateMachine;
use Scs\Derivation;

/**
 * Phase 9 — Constitutional Operational Awareness against REAL MySQL: derived/read-only operational
 * model, workflow-state vs constitutional-state distinction, append-only Notification History distinct
 * from Technical Audit + Operational History, and the MANDATORY regressions.
 * Skipped automatically when no database connection is available.
 */
final class OperationsTest extends TestCase
{
    private Database $db;
    private Repository $repo;
    private Operations $ops;
    private Notifications $notify;

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
        $this->db->pdo()->exec('DELETE FROM notification_history');
        $this->db->pdo()->exec('DELETE FROM audit_log');
        // Assignment Directives carry a hard FK (agent -> ai_collaborators.id); seed the referenced
        // agents before any directive is created.
        $this->repo->upsert('aiCollaborators', ['id' => 'ai-x', 'name' => '#X']);
        $this->repo->upsert('aiCollaborators', ['id' => 'ai-y', 'name' => '#Y']);
        $this->ops = new Operations();
        $this->notify = new Notifications($this->db);
    }

    /** Load the collections the operations engine reads. */
    private function collections(): array
    {
        $out = [];
        foreach (['deliverables', 'gates', 'assignmentDirectives', 'evidence'] as $c) {
            $out[$c] = array_map(static fn($r) => $r['record'], $this->repo->list($c));
        }
        return $out;
    }

    private function seedReviewWork(): void
    {
        $this->repo->upsert('deliverables', ['id' => 'd1', 'deliverableId' => 'ST-DLV-X', 'status' => 'In review']);
        $this->repo->upsert('gates', ['id' => 'g1', 'name' => 'Phase 9 Review', 'status' => 'Open — pending Product Owner review']);
        $this->repo->upsert('assignmentDirectives', ['id' => 'a1', 'directiveId' => 'ST-ADR-X', 'agent' => 'ai-x', 'status' => 'Active']);
    }

    // ---- Derived, read-only, deterministic --------------------------------------------------
    public function testOperationsIsDerivedReadOnlyDeterministic(): void
    {
        $this->seedReviewWork();
        $verBefore = $this->repo->getAny('deliverables', 'd1')['version'];
        $a = $this->ops->derive($this->collections(), '2026-07-26T00:00:00Z');
        $b = $this->ops->derive($this->collections(), '2026-07-26T00:00:00Z');
        $this->assertTrue($a['readOnly']);
        $this->assertSame('server', $a['source']);
        $this->assertSame(Derivation::canonicalize($a), Derivation::canonicalize($b), 'operational derivation must be deterministic');
        $this->assertSame($verBefore, $this->repo->getAny('deliverables', 'd1')['version'], 'deriving operations must never mutate a record');
    }

    public function testNotificationsAreDerivedAndNonAuthoritative(): void
    {
        $this->seedReviewWork();
        $model = $this->ops->derive($this->collections(), null);
        $types = array_column($model['notifications'], 'type');
        $this->assertContains('review-request', $types);
        $this->assertContains('approval', $types);
        // A notification carries no authority field and no ability to change constitutional state.
        foreach ($model['notifications'] as $n) {
            $this->assertArrayNotHasKey('authorityStatus', $n);
        }
        // Constitutional state of the deliverable is unchanged by notification derivation.
        $this->assertSame('reported', StateMachine::stateOf($this->repo->getAny('deliverables', 'd1')['record']));
    }

    // ---- Workflow state is DISTINCT from constitutional state --------------------------------
    public function testWorkflowStateDistinctFromConstitutionalState(): void
    {
        $this->seedReviewWork();
        $model = $this->ops->derive($this->collections(), null);
        $dlv = null;
        foreach ($model['workflowStates'] as $w) if ($w['kind'] === 'deliverable' && $w['id'] === 'd1') $dlv = $w;
        $this->assertNotNull($dlv);
        $this->assertSame('awaiting-review', $dlv['workflowState']);   // workflow state
        $this->assertSame('reported', $dlv['constitutionalState']);    // constitutional state
        $this->assertNotSame($dlv['workflowState'], $dlv['constitutionalState'], 'workflow state must be distinct from constitutional state');
    }

    public function testEscalationIsDerivedForBlockedWork(): void
    {
        $this->repo->upsert('assignmentDirectives', ['id' => 'a2', 'directiveId' => 'ST-ADR-Y', 'agent' => 'ai-y', 'status' => 'Blocked on dependency']);
        $model = $this->ops->derive($this->collections(), null);
        $related = array_column($model['escalation'], 'related');
        $this->assertContains('assignmentDirectives/a2', $related);
    }

    // ---- Notification History: append-only, deduped, distinct stream -------------------------
    public function testNotificationHistoryAppendOnlyAndDeduped(): void
    {
        $n = ['type' => 'review-request', 'subject' => 's', 'recipients' => 'product_owner', 'relatedRecord' => 'deliverables/d1', 'reason' => 'r', 'attention' => 'attention-required', 'dedupeKey' => 'review-request|deliverables/d1'];
        $this->assertTrue($this->notify->record($n), 'first record is new');
        $this->assertFalse($this->notify->record($n), 'duplicate (same dedupe key) is not re-recorded');
        $this->assertSame(1, $this->notify->count(), 'notification history is deduped, append-only');
    }

    public function testNotificationHistoryDistinctFromAuditAndOperationalHistory(): void
    {
        $auditBefore = (int)$this->db->pdo()->query('SELECT COUNT(*) FROM audit_log')->fetchColumn();
        $ohBefore = (int)$this->db->pdo()->query('SELECT COUNT(*) FROM operational_history')->fetchColumn();
        $this->notify->record(['type' => 'approval', 'subject' => 's', 'relatedRecord' => 'gates/g1', 'dedupeKey' => 'approval|gates/g1']);
        $this->assertSame(1, $this->notify->count());
        $this->assertSame($auditBefore, (int)$this->db->pdo()->query('SELECT COUNT(*) FROM audit_log')->fetchColumn(), 'recording a notification must not write the Technical Audit Log');
        $this->assertSame($ohBefore, (int)$this->db->pdo()->query('SELECT COUNT(*) FROM operational_history')->fetchColumn(), 'recording a notification must not write Operational History');
    }

    // ---- MANDATORY regressions --------------------------------------------------------------
    public function testQueuesOrganizeButNeverApprove(): void
    {
        $this->seedReviewWork();
        $model = $this->ops->derive($this->collections(), null);
        // The Product Owner review queue lists work but selecting it changes nothing constitutional.
        $this->assertNotEmpty($model['reviewQueues']['productOwner']);
        $this->assertSame('reported', StateMachine::stateOf($this->repo->getAny('deliverables', 'd1')['record']));
        $this->assertSame('proposed', StateMachine::stateOf($this->repo->getAny('gates', 'g1')['record'] ?? ['authorityStatus' => 'proposed']));
    }

    public function testOperationalModelHasNoMutationSurface(): void
    {
        // The operational model is a pure read: no field grants authority or requests a transition.
        $model = $this->ops->derive($this->collections(), null);
        $this->assertArrayHasKey('readOnly', $model);
        $this->assertTrue($model['readOnly']);
        $this->assertArrayNotHasKey('command', $model);
        $this->assertArrayNotHasKey('authorityStatus', $model);
    }
}
