<?php
declare(strict_types=1);

namespace Scs;

/**
 * Constitutional Operational Awareness (Phase 9) — DERIVED, READ-ONLY coordination of governed work.
 *
 * Operational awareness informs action; constitutional authority authorizes action. This engine
 * derives notifications, an attention model, assignment awareness, review queues, escalation, and
 * WORKFLOW STATE from authoritative records. It never mutates constitutional state, never approves,
 * and never becomes authority (Constitutional Observability + Governed Command Principles).
 *
 * Determinism (Constitutional Derivation Principles): a pure function of (records, asOf). Time-based
 * signals (overdue/reminder) use the EXPLICIT `asOf` argument — never the wall clock — so the output
 * is reproducible. When `asOf` is null, time-based signals are simply not evaluated.
 *
 * WORKFLOW STATE IS PERMANENTLY DISTINCT FROM CONSTITUTIONAL STATE. This engine reports workflow
 * state (waiting/ready/assigned/in-progress/awaiting-review/awaiting-approval/blocked/completed/
 * accepted/archived) alongside — never in place of — the constitutional state (StateMachine::stateOf).
 */
final class Operations
{
    private static function m(?string $s, string $re): bool { return (bool)preg_match($re, (string)$s); }

    /** Derive the workflow state of a governed record (distinct from its constitutional state). */
    public static function workflowStateOf(string $kind, array $r): string
    {
        $status = (string)($r['status'] ?? '');
        $lifecycle = $r['lifecycleState'] ?? null;
        if (in_array($lifecycle, ['archived', 'retired'], true)) return 'archived';
        if ($kind === 'deliverable') {
            if (self::m($status, '/accepted/i') || !empty($r['acceptance'])) return 'accepted';
            if (self::m($status, '/in review|proposed|pending/i')) return 'awaiting-review';
            if (self::m($status, '/block/i')) return 'blocked';
            return 'in-progress';
        }
        if ($kind === 'gate') {
            return self::m($status, '/closed|approved/i') ? 'completed' : 'awaiting-approval';
        }
        if ($kind === 'directive') {
            if (self::m($status, '/closed/i')) return 'completed';
            if (self::m($status, '/block/i')) return 'blocked';
            if (self::m($status, '/wait/i')) return 'waiting';
            if (self::m($status, '/active/i')) return 'in-progress';
            return 'assigned';
        }
        return 'ready';
    }

    /**
     * @param array<string,array<int,array<string,mixed>>> $c collections
     * @param string|null $asOf explicit reference time (ISO-8601); NEVER the wall clock
     * @return array<string,mixed>
     */
    public function derive(array $c, ?string $asOf = null): array
    {
        $deliverables = $c['deliverables'] ?? [];
        $gates = $c['gates'] ?? [];
        $directives = $c['assignmentDirectives'] ?? [];
        $evidence = $c['evidence'] ?? [];

        $workflowStates = [];
        $notifications = [];
        $escalation = [];
        $attentionItems = [];

        $note = static function (string $type, string $subject, string $recipients, string $related, string $reason, string $attention) use (&$notifications) {
            $notifications[] = [
                'type' => $type, 'subject' => $subject, 'recipients' => $recipients,
                'relatedRecord' => $related, 'reason' => $reason, 'attention' => $attention,
                'dedupeKey' => $type . '|' . $related, // one live surface per (type, record)
            ];
        };

        // ---- Deliverables → review-request notifications + workflow/attention ----
        foreach ($deliverables as $d) {
            $ws = self::workflowStateOf('deliverable', $d);
            $cs = StateMachine::stateOf($d);
            $workflowStates[] = ['kind' => 'deliverable', 'id' => $d['id'] ?? '', 'workflowState' => $ws, 'constitutionalState' => $cs];
            if ($ws === 'awaiting-review') {
                $rec = (string)($d['deliverableId'] ?? $d['id'] ?? '');
                $note('review-request', "Deliverable {$rec} awaiting review", 'product_owner', 'deliverables/' . ($d['id'] ?? ''), 'deliverable is in review', 'attention-required');
                $attentionItems[] = ['related' => 'deliverables/' . ($d['id'] ?? ''), 'attention' => 'attention-required'];
                $escalation[] = ['related' => 'deliverables/' . ($d['id'] ?? ''), 'reason' => 'awaiting Product Owner review', 'escalation' => 'reminder'];
            } elseif ($ws === 'blocked') {
                $attentionItems[] = ['related' => 'deliverables/' . ($d['id'] ?? ''), 'attention' => 'blocker'];
                $escalation[] = ['related' => 'deliverables/' . ($d['id'] ?? ''), 'reason' => 'deliverable blocked', 'escalation' => 'blocker'];
            }
        }

        // ---- Gates → approval notifications ----
        foreach ($gates as $g) {
            $ws = self::workflowStateOf('gate', $g);
            $workflowStates[] = ['kind' => 'gate', 'id' => $g['id'] ?? '', 'workflowState' => $ws, 'constitutionalState' => StateMachine::stateOf($g)];
            if ($ws === 'awaiting-approval') {
                $name = (string)($g['name'] ?? $g['id'] ?? '');
                $note('approval', "{$name} awaiting Product Owner approval", 'product_owner', 'gates/' . ($g['id'] ?? ''), 'review gate is open', 'attention-required');
                $attentionItems[] = ['related' => 'gates/' . ($g['id'] ?? ''), 'attention' => 'attention-required'];
            }
        }

        // ---- Directives → assignment / blocker notifications ----
        foreach ($directives as $a) {
            $ws = self::workflowStateOf('directive', $a);
            $workflowStates[] = ['kind' => 'directive', 'id' => $a['id'] ?? '', 'workflowState' => $ws, 'constitutionalState' => StateMachine::stateOf($a)];
            $agent = (string)($a['agent'] ?? 'unassigned');
            if ($ws === 'in-progress') {
                $note('assignment', "Assignment {$a['directiveId']} in progress", $agent, 'assignmentDirectives/' . ($a['id'] ?? ''), 'active assignment', 'informational');
            } elseif ($ws === 'blocked') {
                $note('blocker', "Assignment {$a['directiveId']} blocked", $agent, 'assignmentDirectives/' . ($a['id'] ?? ''), 'assignment blocked', 'blocker');
                $attentionItems[] = ['related' => 'assignmentDirectives/' . ($a['id'] ?? ''), 'attention' => 'blocker'];
                $escalation[] = ['related' => 'assignmentDirectives/' . ($a['id'] ?? ''), 'reason' => 'assignment blocked', 'escalation' => 'blocker'];
            } elseif ($ws === 'waiting') {
                $attentionItems[] = ['related' => 'assignmentDirectives/' . ($a['id'] ?? ''), 'attention' => 'warning'];
            }
        }

        // ---- Assignment awareness (derived counts) ----
        $dirStates = array_map(static fn($a) => self::workflowStateOf('directive', $a), $directives);
        $dlvStates = array_map(static fn($d) => self::workflowStateOf('deliverable', $d), $deliverables);
        $assignmentAwareness = [
            'assigned'         => count(array_filter($dirStates, static fn($s) => $s === 'assigned')),
            'inProgress'       => count(array_filter($dirStates, static fn($s) => $s === 'in-progress')),
            'blocked'          => count(array_filter($dirStates, static fn($s) => $s === 'blocked')) + count(array_filter($dlvStates, static fn($s) => $s === 'blocked')),
            'waiting'          => count(array_filter($dirStates, static fn($s) => $s === 'waiting')),
            'completed'        => count(array_filter($dirStates, static fn($s) => $s === 'completed')),
            'awaitingReview'   => count(array_filter($dlvStates, static fn($s) => $s === 'awaiting-review')),
            'accepted'         => count(array_filter($dlvStates, static fn($s) => $s === 'accepted')),
        ];

        // ---- Review queues (derived; organize work, NEVER approve) ----
        $poQueue = array_merge(
            array_values(array_map(static fn($g) => ['kind' => 'gate', 'id' => $g['id'] ?? '', 'label' => $g['name'] ?? ''], array_filter($gates, static fn($g) => self::workflowStateOf('gate', $g) === 'awaiting-approval'))),
            array_values(array_map(static fn($d) => ['kind' => 'deliverable', 'id' => $d['id'] ?? '', 'label' => $d['deliverableId'] ?? ''], array_filter($deliverables, static fn($d) => self::workflowStateOf('deliverable', $d) === 'awaiting-review')))
        );
        $reviewQueues = [
            'productOwner'  => $poQueue,
            'governance'    => [],
            'architecture'  => [],
            'implementation'=> [],
            'verification'  => [],
            'documentation' => [],
            'evidence'      => array_values(array_map(static fn($e) => ['kind' => 'evidence', 'id' => $e['id'] ?? ''], array_filter($evidence, static fn($e) => self::m((string)($e['status'] ?? ''), '/in review|proposed|pending/i')))),
        ];

        // ---- Attention model summary ----
        $attentionByState = [];
        foreach ($attentionItems as $it) {
            $attentionByState[$it['attention']] = ($attentionByState[$it['attention']] ?? 0) + 1;
        }

        return [
            'source' => 'server', 'readOnly' => true, 'asOf' => $asOf,
            'notifications' => $notifications,
            'attention' => ['byState' => $attentionByState, 'items' => $attentionItems],
            'assignmentAwareness' => $assignmentAwareness,
            'reviewQueues' => $reviewQueues,
            'escalation' => $escalation,
            'workflowStates' => $workflowStates,
            'note' => 'operational awareness — derived, read-only; never modifies constitutional state',
        ];
    }
}
