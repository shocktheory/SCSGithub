<?php
declare(strict_types=1);

namespace Scs;

use Psr\Http\Message\ResponseInterface as Response;

/**
 * Governed command dispatcher. Authority changes never happen through raw document replacement.
 *
 * Phase 5: `upsert` (optimistic concurrency + idempotency).
 * Phase 6: authorization enforcement + the Product-Owner-only `approve` command + attribution.
 *   - `upsert` may NOT set an elevated authority (approved/accepted/activated); that requires `approve`.
 *   - `approve` requires an authenticated Product Owner with fresh MFA (Authz::canApprove).
 *   - every mutation records an attribution (actor + request id).
 */
final class Commands
{
    private array $idempotency = [];

    public function __construct(private readonly Repository $repo, private readonly ?Auth $auth = null) {}

    /** @param array{id:string,role:string,mfaVerified?:bool,mfaFresh?:bool}|null $actor */
    public function handle(string $command, array $body, Response $response, ?array $actor = null, ?string $requestId = null): Response
    {
        return match ($command) {
            'upsert'  => $this->upsert($body, $response, $actor, $requestId),
            'approve' => $this->approve($body, $response, $actor, $requestId),
            default   => Http::json($response->withStatus(404), ['error' => "unknown command: {$command}"]),
        };
    }

    private function upsert(array $body, Response $response, ?array $actor, ?string $requestId): Response
    {
        $collection = (string)($body['collection'] ?? '');
        Http::assertCollection($collection);
        $record = $body['record'] ?? null;
        if (!is_array($record) || !isset($record['id'])) {
            return Http::json($response->withStatus(422), ['error' => 'invalid upsert: record with id required']);
        }
        if (!Authz::can($actor, 'propose')) {
            return Http::json($response->withStatus(403), ['error' => 'not permitted to write records']);
        }
        // The approval boundary: a plain upsert may never set elevated authority — that requires `approve`.
        $incomingAuthority = $record['authorityStatus'] ?? null;
        if (Authz::isElevatedAuthority(is_string($incomingAuthority) ? $incomingAuthority : null)) {
            return Http::json($response->withStatus(403), ['error' => 'authority elevation requires an approval command (POST /api/commands/approve by the Product Owner)']);
        }
        $existing = $this->repo->get($collection, (string)$record['id']);
        if ($existing !== null && ($existing['record']['authorityStatus'] ?? null) !== $incomingAuthority
            && Authz::isElevatedAuthority($existing['record']['authorityStatus'] ?? null)) {
            // Cannot downgrade/alter an already-approved record's authority via upsert.
            return Http::json($response->withStatus(403), ['error' => 'cannot change the authority of an approved record via upsert']);
        }

        $key = (string)($body['idempotencyKey'] ?? '');
        if ($key !== '' && isset($this->idempotency[$key])) {
            [$status, $payload] = $this->idempotency[$key];
            return Http::json($response->withStatus($status), $payload);
        }
        $expected = array_key_exists('expectedVersion', $body) ? (int)$body['expectedVersion'] : null;
        $current = $this->repo->currentVersion($collection, (string)$record['id']);
        if ($expected !== null && $current !== $expected) {
            $existing2 = $this->repo->get($collection, (string)$record['id']);
            return Http::json($response->withStatus(409), ['currentVersion' => $current ?? 0, 'currentRecord' => $existing2['record'] ?? null]);
        }
        $version = $this->repo->upsert($collection, $record);
        $this->repo->attribute($collection, (string)$record['id'], $actor, 'upsert', $requestId);
        $payload = ['record' => $record, 'version' => $version];
        if ($key !== '') $this->idempotency[$key] = [200, $payload];
        return Http::json($response, $payload);
    }

    /** Product-Owner-only authority transition (approve/accept/activate). */
    private function approve(array $body, Response $response, ?array $actor, ?string $requestId): Response
    {
        if ($actor === null) {
            return Http::json($response->withStatus(401), ['error' => 'authentication required']);
        }
        if (!Authz::canApprove($actor)) {
            return Http::json($response->withStatus(403), ['error' => 'only an authenticated Product Owner (with fresh MFA) may exercise approval authority']);
        }
        $collection = (string)($body['collection'] ?? '');
        Http::assertCollection($collection);
        $id = (string)($body['id'] ?? '');
        $transition = (string)($body['transition'] ?? 'approved');
        if (!in_array($transition, ['approved', 'accepted', 'activated'], true)) {
            return Http::json($response->withStatus(422), ['error' => 'invalid transition']);
        }
        $existing = $this->repo->get($collection, $id);
        if ($existing === null) {
            return Http::json($response->withStatus(404), ['error' => 'record not found']);
        }
        $record = $existing['record'];
        $record['authorityStatus'] = $transition === 'approved' ? 'approved' : $record['authorityStatus'] ?? 'reported';
        $record['acceptance'] = $transition === 'accepted' ? true : ($record['acceptance'] ?? null);
        $record['activation'] = $transition === 'activated' ? true : ($record['activation'] ?? null);
        $version = $this->repo->upsert($collection, $record);
        $this->repo->attribute($collection, $id, $actor, 'approve:' . $transition, $requestId);
        $this->auth?->event($actor['id'], 'approve', $requestId, "{$collection}/{$id}:{$transition}");
        return Http::json($response, ['record' => $record, 'version' => $version, 'approvedBy' => $actor['id']]);
    }
}
