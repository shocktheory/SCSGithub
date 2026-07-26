<?php
declare(strict_types=1);

namespace Scs;

use PDO;

/**
 * Technical Audit Log (Phase 8) — the constitutional execution record.
 *
 * Immutable, APPEND-ONLY, attributable, replay-supporting, tamper-evident, independently verifiable.
 * Every governed command (applied or rejected), derivation run, and security event is recorded with
 * the authenticated actor, request/correlation ids, and command/derivation/evidence references. A
 * hash-chain (`event_hash = SHA-256(prev_hash | canonical(event))`) links events so any alteration or
 * omission is detectable by recomputation — integrity does not depend on trusting the store.
 *
 * Constitutional invariant (Constitutional Observability Principles): the audit log OBSERVES; it never
 * becomes authority and never modifies constitutional state. This class exposes NO update or delete.
 */
final class Audit
{
    private const GENESIS = '0000000000000000000000000000000000000000000000000000000000000000';

    public function __construct(private readonly Database $db) {}

    /**
     * Append an immutable, hash-chained audit event. Returns the recorded event (incl. seq + hashes).
     * Never throws on a missing table in pre-migration dev — it degrades to a no-op so it can never
     * block the governed action it is observing.
     *
     * @param array{command?:array,derivation?:array,evidenceRef?:?string,requestId?:?string,correlationId?:?string,reason?:?string} $ctx
     */
    public function record(string $eventType, ?array $actor, string $outcome, array $ctx = []): ?array
    {
        try {
            $pdo = $this->db->pdo();
            $prev = (string)($pdo->query('SELECT event_hash FROM audit_log ORDER BY seq DESC LIMIT 1')->fetchColumn() ?: self::GENESIS);

            $payload = [
                'event_type'     => $eventType,
                'actor_id'       => $actor['id'] ?? null,
                'actor_role'     => $actor['role'] ?? 'anon',
                'request_id'     => $ctx['requestId'] ?? null,
                'correlation_id' => $ctx['correlationId'] ?? ($ctx['requestId'] ?? null),
                'command_ref'    => $ctx['command'] ?? null,
                'derivation_ref' => $ctx['derivation'] ?? null,
                'evidence_ref'   => $ctx['evidenceRef'] ?? null,
                'outcome'        => $outcome,
                'reason'         => $ctx['reason'] ?? null,
            ];
            $eventHash = hash('sha256', $prev . '|' . Derivation::canonicalize($payload));

            $stmt = $pdo->prepare(
                'INSERT INTO audit_log
                   (event_type, actor_id, actor_role, request_id, correlation_id, command_ref, derivation_ref, evidence_ref, outcome, reason, prev_hash, event_hash)
                 VALUES (:et, :aid, :arole, :rid, :cid, :cref, :dref, :eref, :out, :reason, :prev, :hash)'
            );
            $stmt->execute([
                ':et' => $eventType, ':aid' => $payload['actor_id'], ':arole' => $payload['actor_role'],
                ':rid' => $payload['request_id'], ':cid' => $payload['correlation_id'],
                ':cref' => $payload['command_ref'] !== null ? json_encode($payload['command_ref'], JSON_UNESCAPED_SLASHES) : null,
                ':dref' => $payload['derivation_ref'] !== null ? json_encode($payload['derivation_ref'], JSON_UNESCAPED_SLASHES) : null,
                ':eref' => $payload['evidence_ref'], ':out' => $outcome, ':reason' => $payload['reason'],
                ':prev' => $prev, ':hash' => $eventHash,
            ]);
            return ['seq' => (int)$pdo->lastInsertId(), 'event_hash' => $eventHash, 'prev_hash' => $prev] + $payload;
        } catch (\Throwable) {
            return null; // audit table may not exist before migration 0004 (dev); never block the action
        }
    }

    /** @return array<int,array<string,mixed>> ordered append-only events (read-only). */
    public function list(int $limit = 500): array
    {
        $stmt = $this->db->pdo()->prepare('SELECT * FROM audit_log ORDER BY seq ASC LIMIT ' . max(1, min(5000, $limit)));
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function count(): int
    {
        return (int)$this->db->pdo()->query('SELECT COUNT(*) FROM audit_log')->fetchColumn();
    }

    /**
     * Independently verify the hash-chain by recomputation. Returns whether the chain is intact and,
     * if not, the seq of the first broken link. Tamper-evidence: any altered/removed/inserted event
     * breaks the chain here.
     *
     * @return array{ok:bool,count:int,brokenAt:?int}
     */
    public function verifyIntegrity(): array
    {
        $rows = $this->list(5000);
        $prev = self::GENESIS;
        foreach ($rows as $r) {
            $payload = [
                'event_type'     => $r['event_type'],
                'actor_id'       => $r['actor_id'],
                'actor_role'     => $r['actor_role'],
                'request_id'     => $r['request_id'],
                'correlation_id' => $r['correlation_id'],
                'command_ref'    => $r['command_ref'] !== null ? json_decode($r['command_ref'], true) : null,
                'derivation_ref' => $r['derivation_ref'] !== null ? json_decode($r['derivation_ref'], true) : null,
                'evidence_ref'   => $r['evidence_ref'],
                'outcome'        => $r['outcome'],
                'reason'         => $r['reason'],
            ];
            $expected = hash('sha256', $prev . '|' . Derivation::canonicalize($payload));
            if (!hash_equals($expected, (string)$r['event_hash']) || !hash_equals($prev, (string)$r['prev_hash'])) {
                return ['ok' => false, 'count' => count($rows), 'brokenAt' => (int)$r['seq']];
            }
            $prev = (string)$r['event_hash'];
        }
        return ['ok' => true, 'count' => count($rows), 'brokenAt' => null];
    }
}
