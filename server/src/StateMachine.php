<?php
declare(strict_types=1);

namespace Scs;

/**
 * Constitutional State Transition Model (Phase 7).
 *
 * Defines the permitted/prohibited transitions of the governed command vocabulary and the
 * constitutional state of a record. Every transition is server-validated: current state, command
 * legality, and preconditions. Rejected transitions fail predictably (TransitionException).
 *
 * State of a record (composite, derived from the record body — never client-authored):
 *   lifecycle terminal states: rejected · superseded · archived · retired  (take precedence)
 *   else activated (activation flag) · accepted (acceptance flag) · else authorityStatus
 *     (reported | verified | proposed | approved | ...).
 */
final class StateMachine
{
    /** command => list of source states from which it is permitted. '(none)' = record absent. */
    public const TRANSITIONS = [
        'propose'   => ['(none)', 'reported', 'proposed', 'rejected'],
        'approve'   => ['reported', 'proposed'],
        'accept'    => ['approved'],
        'activate'  => ['approved', 'accepted'],
        'reject'    => ['reported', 'proposed', 'approved'],
        'supersede' => ['approved', 'accepted', 'activated'],
        'archive'   => ['reported', 'proposed', 'approved', 'accepted', 'activated', 'rejected', 'superseded', 'retired'],
        'restore'   => ['archived'],
        'retire'    => ['archived', 'superseded', 'rejected'],
    ];

    /** Commands that exercise constitutional approval authority — Product-Owner-only (fresh MFA). */
    public const APPROVAL_COMMANDS = ['approve', 'accept', 'activate', 'supersede', 'retire'];

    /** Commands governed by the admin permission (operational lifecycle, not authority). */
    public const ADMIN_COMMANDS = ['archive', 'restore'];

    public static function isCommand(string $command): bool
    {
        return array_key_exists($command, self::TRANSITIONS);
    }

    /** The composite constitutional state of a record. */
    public static function stateOf(?array $record): string
    {
        if ($record === null) return '(none)';
        $lifecycle = $record['lifecycleState'] ?? null;
        if (in_array($lifecycle, ['rejected', 'superseded', 'archived', 'retired'], true)) return $lifecycle;
        if (!empty($record['activation'])) return 'activated';
        if (!empty($record['acceptance'])) return 'accepted';
        $authority = (string)($record['authorityStatus'] ?? 'reported');
        return $authority;
    }

    /**
     * Validate that $command is permitted from $fromState. Throws TransitionException otherwise.
     * Prohibited transitions (skipping an approval gate, mutating a terminal state, unknown command)
     * all fail here — predictably, before any write.
     */
    public static function validate(string $command, string $fromState): void
    {
        if (!self::isCommand($command)) {
            throw new TransitionException("unknown command: {$command}");
        }
        $allowed = self::TRANSITIONS[$command];
        if (!in_array($fromState, $allowed, true)) {
            throw new TransitionException("prohibited transition: '{$command}' is not permitted from state '{$fromState}' (allowed from: " . implode(', ', $allowed) . ')');
        }
    }
}
