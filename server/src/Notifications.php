<?php
declare(strict_types=1);

namespace Scs;

/**
 * Notification History (Phase 9) — the THIRD operational stream, permanently distinct from the
 * Technical Audit Log (technical execution) and Operational History (governance milestones).
 *
 * Append-only, attributable, reconstructable. It records what operational awareness SURFACED — the
 * notification's type, subject, recipients, related record, reason — never what authority was
 * exercised (that stays in Audit/Operational History). Recording a notification changes no governed
 * record and grants no authority. This class exposes NO update or delete.
 */
final class Notifications
{
    public function __construct(private readonly Database $db) {}

    /**
     * Append a surfaced notification to history, de-duplicated by dedupe_key (one live surface per
     * (type, related record)). Returns true if newly recorded, false if already present. Never throws
     * on a missing table (pre-migration dev) — degrades to a no-op.
     */
    public function record(array $n, ?string $requestId = null): bool
    {
        try {
            $stmt = $this->db->pdo()->prepare(
                'INSERT IGNORE INTO notification_history
                   (notification_type, subject, recipients, related_record, reason, attention, dedupe_key, request_id)
                 VALUES (:t, :s, :r, :rel, :reason, :att, :dk, :rid)'
            );
            $stmt->execute([
                ':t' => (string)($n['type'] ?? 'notification'),
                ':s' => (string)($n['subject'] ?? ''),
                ':r' => isset($n['recipients']) ? (string)$n['recipients'] : null,
                ':rel' => isset($n['relatedRecord']) ? (string)$n['relatedRecord'] : null,
                ':reason' => isset($n['reason']) ? (string)$n['reason'] : null,
                ':att' => isset($n['attention']) ? (string)$n['attention'] : null,
                ':dk' => (string)($n['dedupeKey'] ?? (($n['type'] ?? '') . '|' . ($n['relatedRecord'] ?? ''))),
                ':rid' => $requestId,
            ]);
            return $stmt->rowCount() > 0;
        } catch (\Throwable) {
            return false; // table may not exist before migration 0005 (dev); never block
        }
    }

    /** @return array<int,array<string,mixed>> append-only history (read-only). */
    public function list(int $limit = 500): array
    {
        $stmt = $this->db->pdo()->prepare('SELECT * FROM notification_history ORDER BY id ASC LIMIT ' . max(1, min(5000, $limit)));
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function count(): int
    {
        return (int)$this->db->pdo()->query('SELECT COUNT(*) FROM notification_history')->fetchColumn();
    }
}
