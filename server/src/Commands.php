<?php
declare(strict_types=1);

namespace Scs;

use Psr\Http\Message\ResponseInterface as Response;

/**
 * Governed command dispatcher. Authority changes never happen through raw document replacement.
 *
 * Phase 5: `upsert` (optimistic concurrency + idempotency).
 * Phase 6: authorization enforcement + Product-Owner-only `approve` + attribution.
 * Phase 7: the COMPLETE governed command vocabulary on a server-validated state machine —
 *   propose · approve · accept · activate · reject · supersede · archive · restore · retire.
 *   Every command validates authority, current state, preconditions, the approval boundary,
 *   concurrency (expectedVersion), idempotency, and preserves attribution. No command bypasses
 *   server validation; rejected transitions fail predictably.
 */
final class Commands
{
    private array $idempotency = [];

    public function __construct(
        private readonly Repository $repo,
        private readonly ?Auth $auth = null,
        private readonly ?Audit $audit = null, // Phase 8: Technical Audit Log (observes; never authority)
    ) {}

    /** Record a governed-command outcome to the Technical Audit Log (append-only; never blocks). */
    private function audit(string $command, string $collection, string $id, ?array $actor, string $outcome, ?string $requestId, ?string $reason = null, array $extra = []): void
    {
        $this->audit?->record('command.' . $command, $actor, $outcome, [
            'command' => ['collection' => $collection, 'id' => $id, 'command' => $command] + $extra,
            'requestId' => $requestId,
            'reason' => $reason,
        ]);
    }

    /** @param array{id:string,role:string,mfaVerified?:bool,mfaFresh?:bool}|null $actor */
    public function handle(string $command, array $body, Response $response, ?array $actor = null, ?string $requestId = null): Response
    {
        return match ($command) {
            'upsert'  => $this->write($body, $response, $actor, $requestId, 'upsert'),
            'propose' => $this->write($body, $response, $actor, $requestId, 'propose'),
            'approve' => $this->approve($body, $response, $actor, $requestId),
            'accept', 'activate', 'reject', 'supersede', 'archive', 'restore', 'retire'
                      => $this->transition($command, $body, $response, $actor, $requestId),
            default   => Http::json($response->withStatus(404), ['error' => "unknown command: {$command}"]),
        };
    }

    // ===== propose / upsert (guarded write; never elevates authority) ==========================

    private function write(array $body, Response $response, ?array $actor, ?string $requestId, string $label): Response
    {
        $collection = (string)($body['collection'] ?? '');
        Http::assertCollection($collection);
        $record = $body['record'] ?? null;
        if (!is_array($record) || !isset($record['id'])) {
            return Http::json($response->withStatus(422), ['error' => 'invalid write: record with id required']);
        }
        $id = (string)$record['id'];
        if (!Authz::can($actor, 'propose')) {
            $this->audit($label, $collection, $id, $actor, 'rejected', $requestId, 'not permitted to write records');
            return Http::json($response->withStatus(403), ['error' => 'not permitted to write records']);
        }
        // The approval boundary: propose/upsert may NEVER set elevated authority — that requires an
        // approval command exercised by the Product Owner.
        $incomingAuthority = $record['authorityStatus'] ?? null;
        if (Authz::isElevatedAuthority(is_string($incomingAuthority) ? $incomingAuthority : null)) {
            $this->audit($label, $collection, $id, $actor, 'rejected', $requestId, 'authority elevation via ' . $label);
            return Http::json($response->withStatus(403), ['error' => 'authority elevation requires an approval command (POST /api/commands/approve by the Product Owner)']);
        }
        $existing = $this->repo->getAny($collection, $id);
        // Immutable once accepted (Constitutional Evidence / Governed Command Principles): a record that
        // has been accepted may not be mutated via a plain write — it must be superseded by a command.
        if ($existing !== null && !empty($existing['record']['acceptance'])) {
            $this->audit($label, $collection, $id, $actor, 'rejected', $requestId, 'accepted record is immutable');
            return Http::json($response->withStatus(403), ['error' => 'cannot mutate an accepted record via ' . $label . '; supersede it with a governed command']);
        }
        if ($existing !== null && ($existing['record']['authorityStatus'] ?? null) !== $incomingAuthority
            && Authz::isElevatedAuthority($existing['record']['authorityStatus'] ?? null)) {
            $this->audit($label, $collection, $id, $actor, 'rejected', $requestId, 'authority change via ' . $label);
            return Http::json($response->withStatus(403), ['error' => 'cannot change the authority of an approved record via ' . $label]);
        }

        $key = (string)($body['idempotencyKey'] ?? '');
        if ($key !== '' && isset($this->idempotency[$key])) {
            [$status, $payload] = $this->idempotency[$key];
            return Http::json($response->withStatus($status), $payload);
        }
        $expected = array_key_exists('expectedVersion', $body) ? (int)$body['expectedVersion'] : null;
        $current = $this->repo->currentVersion($collection, $id);
        if ($expected !== null && $current !== $expected) {
            $existing2 = $this->repo->get($collection, $id);
            $this->audit($label, $collection, $id, $actor, 'rejected', $requestId, 'version conflict');
            return Http::json($response->withStatus(409), ['currentVersion' => $current ?? 0, 'currentRecord' => $existing2['record'] ?? null]);
        }
        $version = $this->repo->upsert($collection, $record);
        $this->repo->attribute($collection, $id, $actor, $label, $requestId);
        $this->audit($label, $collection, $id, $actor, 'applied', $requestId, null, ['version' => $version]);
        $payload = ['record' => $record, 'version' => $version];
        if ($key !== '') $this->idempotency[$key] = [200, $payload];
        return Http::json($response, $payload);
    }

    // ===== approve (Phase 6 API: optional transition → approved|accepted|activated) ============

    private function approve(array $body, Response $response, ?array $actor, ?string $requestId): Response
    {
        $transition = (string)($body['transition'] ?? 'approved');
        $command = match ($transition) {
            'approved'  => 'approve',
            'accepted'  => 'accept',
            'activated' => 'activate',
            default     => null,
        };
        if ($command === null) {
            return Http::json($response->withStatus(422), ['error' => 'invalid transition']);
        }
        return $this->transition($command, $body, $response, $actor, $requestId);
    }

    // ===== the generic governed transition (approval + lifecycle commands) =====================

    private function transition(string $command, array $body, Response $response, ?array $actor, ?string $requestId): Response
    {
        $collection = (string)($body['collection'] ?? '');
        Http::assertCollection($collection);
        $id = (string)($body['id'] ?? '');
        if ($id === '') {
            return Http::json($response->withStatus(422), ['error' => 'record id required']);
        }

        // ---- Authorization (per-command, least privilege) ----
        // State-independent authority is checked BEFORE reading the record, so an unauthorized
        // actor is denied (401/403) regardless of whether the target exists.
        if ($actor === null) {
            $this->audit($command, $collection, $id, null, 'rejected', $requestId, 'authentication required');
            return Http::json($response->withStatus(401), ['error' => 'authentication required']);
        }
        if (in_array($command, StateMachine::APPROVAL_COMMANDS, true) && !Authz::canApprove($actor)) {
            $this->audit($command, $collection, $id, $actor, 'rejected', $requestId, 'approval authority required');
            return Http::json($response->withStatus(403), ['error' => 'only an authenticated Product Owner (with fresh MFA) may exercise approval authority']);
        }
        if (in_array($command, StateMachine::ADMIN_COMMANDS, true) && !Authz::can($actor, 'admin')) {
            $this->audit($command, $collection, $id, $actor, 'rejected', $requestId, 'administrator authority required');
            return Http::json($response->withStatus(403), ['error' => "the '{$command}' command requires an administrator or the Product Owner"]);
        }

        $existing = $this->repo->getAny($collection, $id);
        if ($existing === null) {
            $this->audit($command, $collection, $id, $actor, 'rejected', $requestId, 'record not found');
            return Http::json($response->withStatus(404), ['error' => 'record not found']);
        }
        $state = StateMachine::stateOf($existing['record']);

        // Reject authorization is state-dependent: rejecting an approved record is a PO act.
        if ($command === 'reject') {
            $ok = $state === 'approved' ? Authz::canApprove($actor) : Authz::can($actor, 'propose');
            if (!$ok) {
                $msg = $state === 'approved' ? 'rejecting an approved record requires the Product Owner' : 'not permitted to reject records';
                $this->audit($command, $collection, $id, $actor, 'rejected', $requestId, $msg);
                return Http::json($response->withStatus(403), ['error' => $msg]);
            }
        }

        // ---- Idempotency ----
        $key = (string)($body['idempotencyKey'] ?? '');
        if ($key !== '' && isset($this->idempotency[$key])) {
            [$status, $payload] = $this->idempotency[$key];
            return Http::json($response->withStatus($status), $payload);
        }

        // ---- Optimistic concurrency ----
        $expected = array_key_exists('expectedVersion', $body) ? (int)$body['expectedVersion'] : null;
        if ($expected !== null && $existing['version'] !== $expected) {
            $this->audit($command, $collection, $id, $actor, 'rejected', $requestId, 'version conflict');
            return Http::json($response->withStatus(409), ['currentVersion' => $existing['version'], 'currentRecord' => $existing['record']]);
        }

        // ---- State-transition validation (predictable rejection) ----
        try {
            StateMachine::validate($command, $state);
        } catch (TransitionException $e) {
            $this->audit($command, $collection, $id, $actor, 'rejected', $requestId, 'prohibited transition from ' . $state);
            return Http::json($response->withStatus(422), ['error' => $e->getMessage(), 'fromState' => $state, 'command' => $command]);
        }

        // ---- Apply the effect ----
        $record = $existing['record'];
        $archived = null;
        switch ($command) {
            case 'approve':   $record['authorityStatus'] = 'approved'; break;
            case 'accept':    $record['acceptance'] = true; break;
            case 'activate':  $record['activation'] = true; break;
            case 'reject':    $record['lifecycleState'] = 'rejected';   if (isset($body['reason'])) $record['rejectionReason'] = (string)$body['reason']; break;
            case 'supersede': $record['lifecycleState'] = 'superseded'; if (isset($body['supersededBy'])) $record['supersededBy'] = (string)$body['supersededBy']; break;
            case 'archive':   $record['lifecycleState'] = 'archived';  $archived = 1; break;
            case 'restore':   $record['lifecycleState'] = 'restored';  $archived = 0; break;
            case 'retire':    $record['lifecycleState'] = 'retired';   $archived = 1; break;
        }
        $version = $this->repo->upsert($collection, $record, $archived);
        $this->repo->attribute($collection, $id, $actor, $command, $requestId);
        if (in_array($command, StateMachine::APPROVAL_COMMANDS, true)) {
            $this->auth?->event($actor['id'], $command, $requestId, "{$collection}/{$id}");
        }
        $toState = StateMachine::stateOf($record);
        $this->audit($command, $collection, $id, $actor, 'applied', $requestId, null, ['fromState' => $state, 'toState' => $toState, 'version' => $version]);
        $payload = ['record' => $record, 'version' => $version, 'command' => $command, 'fromState' => $state, 'toState' => $toState, 'actor' => $actor['id']];
        if ($key !== '') $this->idempotency[$key] = [200, $payload];
        return Http::json($response, $payload);
    }
}
