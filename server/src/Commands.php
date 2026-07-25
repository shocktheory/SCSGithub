<?php
declare(strict_types=1);

namespace Scs;

use Psr\Http\Message\ResponseInterface as Response;

/**
 * Governed command dispatcher (Phase 4 rule): authority changes never happen through raw
 * document replacement. Phase 5 implements the minimum command needed for persistence parity
 * (`upsert`) with optimistic concurrency + idempotency. Approval/activation commands are
 * Phase 6 (authenticated) and are intentionally absent here.
 */
final class Commands
{
    /** In-memory idempotency cache (Phase 5 dev/test). Production uses a persistent store. */
    private array $idempotency = [];

    public function __construct(private readonly Repository $repo) {}

    public function handle(string $command, array $body, Response $response): Response
    {
        return match ($command) {
            'upsert' => $this->upsert($body, $response),
            default  => Http::json($response->withStatus(404), ['error' => "unknown command: {$command}"]),
        };
    }

    private function upsert(array $body, Response $response): Response
    {
        $collection = (string)($body['collection'] ?? '');
        Http::assertCollection($collection);
        $record = $body['record'] ?? null;
        if (!is_array($record) || !isset($record['id'])) {
            return Http::json($response->withStatus(422), ['error' => 'invalid upsert: record with id required']);
        }
        $key = (string)($body['idempotencyKey'] ?? '');
        if ($key !== '' && isset($this->idempotency[$key])) {
            [$status, $payload] = $this->idempotency[$key];
            return Http::json($response->withStatus($status), $payload);
        }

        $expected = array_key_exists('expectedVersion', $body) ? (int)$body['expectedVersion'] : null;
        $current = $this->repo->currentVersion($collection, (string)$record['id']);

        if ($expected !== null && $current !== $expected) {
            // Stale write — never overwrite a newer authoritative record.
            $existing = $this->repo->get($collection, (string)$record['id']);
            return Http::json($response->withStatus(409), [
                'currentVersion' => $current ?? 0,
                'currentRecord'  => $existing['record'] ?? null,
            ]);
        }

        $version = $this->repo->upsert($collection, $record);
        $payload = ['record' => $record, 'version' => $version];
        if ($key !== '') $this->idempotency[$key] = [200, $payload];
        return Http::json($response, $payload);
    }
}
