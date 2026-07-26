<?php
declare(strict_types=1);

namespace Scs;

/**
 * Server-side Constitutional State Derivation Engine (Phase 7).
 *
 * This is the CANONICAL derivation authority: the server derives constitutional state from
 * authoritative records. Clients present; they never author this. It is a faithful port of the
 * client engine (app/src/lib/derivation.ts + team.ts), verified for parity against the client
 * (app/tests/derivation.e2e.test.ts) so migration changes WHERE truth is computed, never WHAT the
 * accepted constitutional truth is.
 *
 * Constitutional Derivation Principles enforced here:
 *  - deterministic: a pure function of (authoritative inputs, derivation version) — NO clock,
 *    randomness, locale, or environment influences the output;
 *  - reproducible / replayable: identical inputs + derivation version => identical output;
 *  - explainable: every derived state carries a `trace` of source records + logic;
 *  - versioned: outputs are stamped with derivation_version and schema_version;
 *  - attributable: inputs are authoritative records (each carrying actor/attribution upstream).
 */
final class Derivation
{
    /** Bump when the derivation RULES change (independent of Repository::SCHEMA_VERSION). */
    public const DERIVATION_VERSION = '1.0.0';

    private const NA_AWAITING = 'Not Applicable — Awaiting Assignment';

    public function __construct(
        private readonly string $derivationVersion = self::DERIVATION_VERSION,
        private readonly string $schemaVersion = Repository::SCHEMA_VERSION,
    ) {}

    public function derivationVersion(): string { return $this->derivationVersion; }
    public function schemaVersion(): string { return $this->schemaVersion; }

    // ===== Canonicalization / hashing (determinism + replay + drift) ==========================

    /** Recursively key-sorted canonical JSON — the basis for a stable input hash. */
    public static function canonicalize(mixed $value): string
    {
        return json_encode(self::sortKeys($value), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    private static function sortKeys(mixed $value): mixed
    {
        if (!is_array($value)) return $value;
        $isList = array_is_list($value);
        if ($isList) return array_map([self::class, 'sortKeys'], $value);
        ksort($value);
        $out = [];
        foreach ($value as $k => $v) $out[$k] = self::sortKeys($v);
        return $out;
    }

    /** Deterministic SHA-256 over canonicalized inputs + derivation version. */
    public function inputHash(mixed $input): string
    {
        return hash('sha256', $this->derivationVersion . '|' . self::canonicalize($input));
    }

    /**
     * Version-compatibility check (independent version systems). Same MAJOR is compatible.
     * Throws VersionException on an incompatible derivation or schema version.
     */
    public function assertCompatible(?string $derivationVersion, ?string $schemaVersion): void
    {
        if ($derivationVersion !== null && $derivationVersion !== $this->derivationVersion) {
            if (self::major($derivationVersion) !== self::major($this->derivationVersion)) {
                throw new VersionException("incompatible derivation_version: expected {$this->derivationVersion}, got {$derivationVersion}");
            }
        }
        if ($schemaVersion !== null && self::major($schemaVersion) !== self::major($this->schemaVersion)) {
            throw new VersionException("incompatible schema_version: expected {$this->schemaVersion}, got {$schemaVersion}");
        }
    }

    private static function major(string $v): string { return explode('.', $v)[0]; }

    // ===== Core constitutional derivation (port of deriveAgentState) ==========================

    /**
     * Derive a single agent's constitutional state from its approved evidence set.
     * Input keys mirror the client DeriveInput; output mirrors DerivedAgentState exactly.
     *
     * @param array<string,mixed> $input
     * @return array<string,mixed>
     */
    public function deriveAgentState(array $input): array
    {
        $agentName = (string)($input['agentName'] ?? '');
        $standingDirective = $input['standingDirective'] ?? null;      // {id,version,status}|null
        $poAuthorityIn = $input['productOwnerAuthority'] ?? null;       // {id,approved}|null
        $activationEventIds = array_values($input['activationEventIds'] ?? []);
        $pendingActivationEventIds = array_values($input['pendingActivationEventIds'] ?? []);
        $teamMembership = $input['teamMembership'] ?? null;             // {label,active}|null
        $membershipConflict = (bool)($input['membershipConflict'] ?? false);
        $conflictingMemberships = array_values($input['conflictingMemberships'] ?? []);
        $activeADR = $input['activeAssignmentDirective'] ?? null;       // {directiveId,title,status,deliverable?,reviewGate?}|null

        // Contradictory governing evidence is surfaced honestly, never silently resolved.
        $contradictions = [];
        if ($membershipConflict) {
            $suffix = $conflictingMemberships ? ': ' . implode(', ', $conflictingMemberships) : '';
            $contradictions[] = "Contradictory active Team Membership records{$suffix} — requires Product Owner resolution";
        }

        // ---- Constitutional activation evidence set ----
        $evIdentity = $agentName !== '';
        $evStandingCurrent = $standingDirective !== null && strtolower((string)($standingDirective['status'] ?? '')) === 'current';
        $evPoAuthority = $poAuthorityIn !== null && !empty($poAuthorityIn['approved']);
        $evActivationEvent = count($activationEventIds) > 0;
        $evTeamActive = ($teamMembership !== null && !empty($teamMembership['active'])) && !$membershipConflict;

        $missingEvidence = [];
        if (!$evIdentity) $missingEvidence[] = 'Agent Identity';
        if (!$evStandingCurrent) $missingEvidence[] = 'Current Standing Directive';
        if (!$evPoAuthority) $missingEvidence[] = 'Product Owner activation authority';
        if (!$evActivationEvent) $missingEvidence[] = 'Operational History activation event';
        if (!$evTeamActive) $missingEvidence[] = $membershipConflict ? 'unambiguous Team Membership' : 'active Team Membership';

        $activated = count($missingEvidence) === 0 && count($contradictions) === 0;
        $hasADR = $activeADR !== null;

        $sdStatus = $standingDirective !== null
            ? "{$standingDirective['id']} {$standingDirective['version']} — {$standingDirective['status']}"
            : 'None on record';
        $teamMembershipDisplay = $teamMembership['label'] ?? 'Not recorded';

        $sourceRecords = [];
        $sourceRecords[] = $standingDirective !== null
            ? "{$standingDirective['id']} {$standingDirective['version']} — {$standingDirective['status']}"
            : 'No Standing Directive';
        $sourceRecords[] = $poAuthorityIn !== null
            ? 'Product Owner authority: ' . $poAuthorityIn['id'] . (empty($poAuthorityIn['approved']) ? ' (not approved)' : '')
            : 'No Product Owner authority';
        foreach ($activationEventIds as $e) $sourceRecords[] = "{$e} (approved Operational History)";
        foreach ($pendingActivationEventIds as $e) $sourceRecords[] = "{$e} (Operational History — PENDING approval, not valid evidence)";
        $sourceRecords[] = $teamMembership !== null ? 'Team membership: ' . $teamMembership['label'] : 'No Team Membership';
        if ($activeADR !== null) $sourceRecords[] = "{$activeADR['directiveId']} — {$activeADR['status']}";

        $missingLinks = [];
        $status = $synchronization = $currentGate = $operationalReadiness = $alignment = '';
        $assignmentDirectiveStatus = $currentAssignment = $logic = '';
        $coverage = 'Not Active';

        if (!$activated) {
            $pendingActivation = $evStandingCurrent;
            $status = $pendingActivation ? 'Pending activation' : 'Pending Onboarding';
            $synchronization = 'Not Yet Applicable';
            $currentGate = $pendingActivation ? 'Constitutional Activation' : 'Constitutional Onboarding';
            $coverage = 'Not Active';
            $operationalReadiness = $pendingActivation ? 'Pending activation — awaiting approved evidence' : 'Onboarding — awaiting activation';
            $alignment = 'Not applicable';
            if ($hasADR) {
                $assignmentDirectiveStatus = "{$activeADR['directiveId']} — {$activeADR['status']} (valid independently of activation)";
                $currentAssignment = (string)$activeADR['title'];
            } else {
                $assignmentDirectiveStatus = 'Not Applicable — Pending Activation';
                $currentAssignment = 'None';
            }
            $pendingNote = $pendingActivationEventIds
                ? ' A pending (unapproved) Operational History activation event exists (' . implode(', ', $pendingActivationEventIds) . ') — awaiting Product Owner approval; it does not satisfy activation.'
                : '';
            $logic = 'Approved activation evidence incomplete (missing: ' . implode(', ', $missingEvidence) . ") ⇒ {$status}. No warning is derived.{$pendingNote}";
        } elseif (!$hasADR) {
            $status = 'Available';
            $synchronization = 'Not Required';
            $currentGate = 'Awaiting Assignment';
            $coverage = 'Full';
            $operationalReadiness = 'Operational — Awaiting First Assignment';
            $alignment = 'Aligned';
            $assignmentDirectiveStatus = self::NA_AWAITING;
            $currentAssignment = 'None';
            $logic = 'Full activation evidence set present ⇒ Operational. No Assignment Directive ⇒ Available; Assignment Directive and downstream records are Not Applicable — Awaiting Assignment (an expected absence, not a deficiency).';
        } else {
            $st = strtolower((string)$activeADR['status']);
            $isBlocked = str_contains($st, 'block');
            $isWaiting = str_contains($st, 'wait');
            $status = $isBlocked ? 'Blocked' : ($isWaiting ? 'Waiting on dependency' : 'Working');
            $synchronization = 'Synchronized';
            $currentGate = $activeADR['reviewGate'] ?? 'In review';
            $operationalReadiness = $isBlocked ? 'Operational — Blocked' : 'Operational — Assigned';
            $alignment = $isBlocked ? 'Warning' : 'Aligned';
            $assignmentDirectiveStatus = "{$activeADR['directiveId']} — {$activeADR['status']}";
            $currentAssignment = (string)$activeADR['title'];
            if (empty($activeADR['deliverable'])) $missingLinks[] = 'Assignment Directive has no linked Deliverable';
            if (empty($activeADR['reviewGate'])) $missingLinks[] = 'Assignment Directive has no Review Gate';
            $coverage = $missingLinks ? 'Partial' : 'Full';
            $logic = "Full activation evidence set + an Assignment Directive ({$activeADR['status']}) ⇒ {$status}. Assignment status derives only from the Assignment Directive; gate from its Review Gate.";
        }

        return [
            'activated' => $activated,
            'missingEvidence' => $missingEvidence,
            'contradictions' => $contradictions,
            'status' => $status,
            'standingDirectiveStatus' => $sdStatus,
            'currentAssignment' => $currentAssignment,
            'assignmentDirectiveStatus' => $assignmentDirectiveStatus,
            'synchronization' => $synchronization,
            'currentGate' => $currentGate,
            'directiveCoverage' => $coverage,
            'operationalReadiness' => $operationalReadiness,
            'teamMembership' => $teamMembershipDisplay,
            'alignment' => $alignment,
            'missingLinks' => $missingLinks,
            'trace' => ['sourceRecords' => $sourceRecords, 'logic' => $logic],
        ];
    }

    // ===== Whole-team derivation from persisted authoritative records (port of deriveTeam) =====

    /**
     * Derive constitutional team state from the authoritative collections. Assignment derives ONLY
     * from Assignment Directives; membership from Team Membership records; activation from approved
     * Operational History activation events. Deterministic given the record set.
     *
     * @param array<string,array<int,array<string,mixed>>> $c collection name => records
     * @return array<string,mixed>
     */
    public function deriveTeam(array $c): array
    {
        $agents = $c['aiCollaborators'] ?? [];
        $decisions = $c['decisions'] ?? [];
        $standingDirectives = $c['standingDirectives'] ?? [];
        $assignmentDirectives = $c['assignmentDirectives'] ?? [];
        $operationalHistory = $c['operationalHistory'] ?? [];
        $teams = $c['teams'] ?? [];
        $teamMemberships = $c['teamMemberships'] ?? [];
        $deliverables = $c['deliverables'] ?? [];
        $gates = $c['gates'] ?? [];

        $byId = static function (array $rows, string $id): ?array {
            foreach ($rows as $r) if (($r['id'] ?? null) === $id) return $r;
            return null;
        };

        $cards = [];
        foreach ($agents as $a) {
            $standing = null;
            foreach ($standingDirectives as $s) if (($s['agent'] ?? null) === ($a['id'] ?? null)) { $standing = $s; break; }
            $governing = ($standing && !empty($standing['governingDecision'])) ? $byId($decisions, (string)$standing['governingDecision']) : null;

            $activationEvents = array_values(array_filter($operationalHistory, static fn($h) =>
                ($h['agent'] ?? null) === ($a['id'] ?? null) && preg_match('/activation/i', (string)($h['evidenceType'] ?? ''))));
            $activationEventIds = array_values(array_map(static fn($h) => (string)$h['entryId'],
                array_filter($activationEvents, static fn($h) => ($h['authorityStatus'] ?? null) === 'approved')));
            $pendingActivationEventIds = array_values(array_map(static fn($h) => (string)$h['entryId'],
                array_filter($activationEvents, static fn($h) => ($h['authorityStatus'] ?? null) !== 'approved')));

            $activeMemberships = array_values(array_filter($teamMemberships, static fn($tm) =>
                ($tm['agent'] ?? null) === ($a['id'] ?? null) && preg_match('/^active$/i', trim((string)($tm['status'] ?? '')))));
            $membershipConflict = count($activeMemberships) > 1;
            $membership = count($activeMemberships) === 1 ? $activeMemberships[0] : null;
            $team = $membership ? $byId($teams, (string)($membership['team'] ?? '')) : null;
            $conflictingMemberships = [];
            if ($membershipConflict) {
                foreach ($activeMemberships as $tm) {
                    $t = $byId($teams, (string)($tm['team'] ?? ''));
                    $conflictingMemberships[] = ($tm['membershipId'] ?? '') . ' → ' . ($t['teamId'] ?? $tm['team'] ?? '');
                }
            }

            $openADRs = array_values(array_filter($assignmentDirectives, static fn($d) =>
                ($d['agent'] ?? null) === ($a['id'] ?? null) && !preg_match('/closed/i', (string)($d['status'] ?? ''))));
            $activeADR = null;
            foreach ($openADRs as $d) if (preg_match('/active/i', (string)$d['status'])) { $activeADR = $d; break; }
            if ($activeADR === null && $openADRs) $activeADR = $openADRs[0];
            $adrDeliverable = ($activeADR && !empty($activeADR['deliverable'])) ? $byId($deliverables, (string)$activeADR['deliverable']) : null;
            $adrGate = ($activeADR && !empty($activeADR['reviewGate'])) ? $byId($gates, (string)$activeADR['reviewGate']) : null;

            $derived = $this->deriveAgentState([
                'agentName' => (string)($a['name'] ?? ''),
                'standingDirective' => $standing ? ['id' => $standing['directiveId'], 'version' => $standing['version'], 'status' => $standing['status']] : null,
                'productOwnerAuthority' => $governing ? ['id' => $governing['decisionId'], 'approved' => ($governing['authorityStatus'] ?? null) === 'approved'] : null,
                'activationEventIds' => $activationEventIds,
                'pendingActivationEventIds' => $pendingActivationEventIds,
                'teamMembership' => ($membership && $team) ? ['label' => "{$team['teamId']} — {$membership['status']}", 'active' => (bool)preg_match('/active/i', (string)$membership['status'])] : null,
                'membershipConflict' => $membershipConflict,
                'conflictingMemberships' => $conflictingMemberships,
                'activeAssignmentDirective' => $activeADR ? [
                    'directiveId' => $activeADR['directiveId'], 'title' => $activeADR['title'], 'status' => $activeADR['status'],
                    'deliverable' => $adrDeliverable['title'] ?? null, 'reviewGate' => $adrGate['name'] ?? null,
                ] : null,
            ]);

            $cards[] = $derived + [
                'id' => $a['id'] ?? '', 'name' => $a['name'] ?? '', 'role' => $a['role'] ?? '',
                'assigned' => $activeADR !== null,
                'onboarding' => !$derived['activated'],
                'assignmentDirectiveId' => $activeADR['id'] ?? null,
            ];
        }

        $contradicted = array_values(array_filter($cards, static fn($c) => !empty($c['contradictions'])));
        return [
            'agents' => $cards,
            'metrics' => [
                'activeAgents' => count(array_filter($cards, static fn($c) => $c['activated'])),
                'activeAssignments' => count(array_filter($cards, static fn($c) => $c['assigned'])),
                'pendingOnboarding' => count(array_filter($cards, static fn($c) => $c['onboarding'])),
                'contradictions' => count($contradicted),
            ],
        ];
    }
}
