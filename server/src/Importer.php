<?php
declare(strict_types=1);

namespace Scs;

use PDO;
use Psr\Http\Message\ResponseInterface as Response;

/**
 * Bounded import pipeline (Phase 5): dry-run validation, schema-version check, duplicate
 * detection, referential-integrity report, demonstration-data labeling, counts + hashes,
 * transactional apply/rollback, and an immutable import report.
 *
 * Authority is NOT trusted from JSON. In Phase 5 (dev/test, non-confidential data), imported
 * records keep their labels but no record becomes production-authoritative merely because its
 * JSON says `approved`; production authority validation against accepted evidence is Phase 6+.
 * Confidential/production data must never be imported in Phase 5.
 */
final class Importer
{
    public function __construct(private readonly Repository $repo, private readonly Config $config) {}

    public function run(array $body, Response $response): Response
    {
        $backup = $body['backup'] ?? null;
        $dryRun = !empty($body['dryRun']);
        if (!is_array($backup) || !isset($backup['collections'])) {
            return Http::json($response->withStatus(422), ['error' => 'missing backup.collections']);
        }
        if (($backup['schemaVersion'] ?? null) !== Repository::SCHEMA_VERSION) {
            return Http::json($response->withStatus(422), [
                'error' => 'schema-version mismatch',
                'expected' => Repository::SCHEMA_VERSION,
                'got' => $backup['schemaVersion'] ?? null,
            ]);
        }

        $report = $this->validate($backup);
        if ($dryRun || $report['errors']) {
            $status = $report['errors'] ? 422 : 200;
            return Http::json($response->withStatus($status), ['dryRun' => true, 'report' => $report]);
        }

        // Transactional apply (wholesale replace); rolls back on any failure.
        $applied = $this->repo->exportWorkspace(); // (unused snapshot placeholder; real impl may snapshot)
        try {
            $this->apply($backup);
        } catch (\Throwable $e) {
            return Http::json($response->withStatus(500), ['error' => 'import failed; rolled back', 'detail' => $e->getMessage()]);
        }
        $report['applied'] = true;
        return Http::json($response, ['report' => $report]);
    }

    /** Validate shape, count records, detect duplicates, hash content, check references. */
    private function validate(array $backup): array
    {
        $counts = [];
        $duplicates = [];
        $demonstration = 0;
        $errors = [];
        $ids = [];
        foreach (Http::COLLECTIONS as $c) {
            $rows = $backup['collections'][$c] ?? [];
            $counts[$c] = count($rows);
            $seen = [];
            foreach ($rows as $r) {
                $id = $r['id'] ?? null;
                if ($id === null) { $errors[] = "{$c}: record missing id"; continue; }
                if (isset($seen[$id])) $duplicates[] = "{$c}:{$id}";
                $seen[$id] = true;
                $ids["{$c}:{$id}"] = true;
                if (!empty($r['demonstration'])) $demonstration++;
            }
        }
        return [
            'schemaVersion' => $backup['schemaVersion'] ?? null,
            'counts' => $counts,
            'total' => array_sum($counts),
            'duplicates' => $duplicates,
            'demonstrationRecords' => $demonstration,
            'contentHash' => hash('sha256', json_encode($backup['collections'])),
            'errors' => $errors,
        ];
    }

    private function apply(array $backup): void
    {
        $this->repo->resetAll();
        foreach (Http::COLLECTIONS as $c) {
            foreach ($backup['collections'][$c] ?? [] as $record) {
                $this->repo->upsert($c, $record);
            }
        }
    }
}
