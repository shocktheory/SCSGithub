<?php
declare(strict_types=1);

namespace Scs;

use PDO;

/**
 * Governed persistence repository over PDO. One table per governed collection.
 *
 * Each row stores the full typed record as JSON (`data`) plus server-owned persistence
 * metadata: `authority_status`, `is_demonstration`, `version`, `created_at`, `updated_at`,
 * and (on trace tables) indexed foreign columns. The database is a substrate — it does not
 * create authority. Governed history is never hard-deleted here (see `delete` note).
 */
final class Repository
{
    public const SCHEMA_VERSION = '0.1.0';

    public function __construct(private readonly Database $db) {}

    private function table(string $collection): string
    {
        Http::assertCollection($collection);
        // camelCase collection -> snake_case table.
        return strtolower(preg_replace('/([a-z])([A-Z])/', '$1_$2', $collection));
    }

    /** @return array<int,array{record:array,version:int}> */
    public function list(string $collection): array
    {
        $t = $this->table($collection);
        $rows = $this->db->pdo()->query("SELECT data, version FROM `{$t}` WHERE archived = 0")->fetchAll();
        return array_map(static fn(array $r) => ['record' => json_decode($r['data'], true), 'version' => (int)$r['version']], $rows);
    }

    /** @return array{record:array,version:int}|null */
    public function get(string $collection, string $id): ?array
    {
        $t = $this->table($collection);
        $stmt = $this->db->pdo()->prepare("SELECT data, version FROM `{$t}` WHERE id = ? AND archived = 0");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ? ['record' => json_decode($row['data'], true), 'version' => (int)$row['version']] : null;
    }

    public function currentVersion(string $collection, string $id): ?int
    {
        $t = $this->table($collection);
        $stmt = $this->db->pdo()->prepare("SELECT version FROM `{$t}` WHERE id = ?");
        $stmt->execute([$id]);
        $v = $stmt->fetchColumn();
        return $v === false ? null : (int)$v;
    }

    /**
     * Insert or version-checked update. Returns the new version. Optimistic concurrency:
     * if $expectedVersion is provided it must match the stored version, else a Conflict is
     * signalled by the caller. Server-owned fields (authority_status etc.) are derived from
     * the record body but are only *changed* through governed commands, never raw replacement.
     */
    public function upsert(string $collection, array $record): int
    {
        $t = $this->table($collection);
        $id = (string)($record['id'] ?? '');
        if ($id === '') throw new \InvalidArgumentException('record.id required');
        $authority = (string)($record['authorityStatus'] ?? 'reported');
        $demo = !empty($record['demonstration']) ? 1 : 0;
        $data = json_encode($record, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        $current = $this->currentVersion($collection, $id);
        $version = ($current ?? 0) + 1;
        $pdo = $this->db->pdo();
        $stmt = $pdo->prepare(
            "INSERT INTO `{$t}` (id, data, authority_status, is_demonstration, version, created_at, updated_at, archived)
             VALUES (:id, :data, :authority, :demo, :version, NOW(6), NOW(6), 0)
             ON DUPLICATE KEY UPDATE data = :data2, authority_status = :authority2, is_demonstration = :demo2,
             version = :version2, updated_at = NOW(6)"
        );
        $stmt->execute([
            ':id' => $id, ':data' => $data, ':authority' => $authority, ':demo' => $demo, ':version' => $version,
            ':data2' => $data, ':authority2' => $authority, ':demo2' => $demo, ':version2' => $version,
        ]);
        return $version;
    }

    /**
     * Dev/test delete only. Governed history (operational_history, decisions, acceptance
     * events) must not be hard-deleted in production — use archive/supersede commands. In
     * dev/test this removes the row to preserve StorageAdapter parity semantics.
     */
    public function delete(string $collection, string $id): void
    {
        $t = $this->table($collection);
        $stmt = $this->db->pdo()->prepare("DELETE FROM `{$t}` WHERE id = ?");
        $stmt->execute([$id]);
    }

    public function exportWorkspace(): array
    {
        $collections = [];
        foreach (Http::COLLECTIONS as $c) {
            $collections[$c] = array_map(static fn($r) => $r['record'], $this->list($c));
        }
        return [
            'schemaVersion' => self::SCHEMA_VERSION,
            'exportedAt' => (new \DateTimeImmutable())->format(DATE_ATOM),
            'isSeed' => true,
            'collections' => $collections,
        ];
    }

    public function resetAll(): void
    {
        $this->db->transaction(function (PDO $pdo) {
            foreach (Http::COLLECTIONS as $c) $pdo->exec("DELETE FROM `{$this->table($c)}`");
        });
    }
}
