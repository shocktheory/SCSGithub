-- SCS Phase 9 — Constitutional Operational Awareness (Notification History).
--
-- notification_history: the THIRD operational stream — permanently distinct from the Technical Audit
-- Log (technical execution) and Operational History (governance milestones). It preserves the
-- operational communication history: what was surfaced, to whom, and why. Append-only, attributable,
-- reconstructable. Notifications are DERIVED from constitutional state; they never approve, reject,
-- activate, authorize, supersede, or modify constitutional state. Recording a surfaced notification
-- here changes no governed record.
--
-- Not a governed collection (not in Http::COLLECTIONS) — it is an operational-awareness substrate.
-- Not authorized for production (SCS_ENV must be development/test). No confidential data.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS notification_history (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  notification_type VARCHAR(48)  NOT NULL,
  subject         VARCHAR(255) NOT NULL,
  recipients      VARCHAR(191) NULL,               -- role(s)/actor(s) surfaced to
  related_record  VARCHAR(191) NULL,               -- collection/id the notification is about
  reason          VARCHAR(255) NULL,
  attention       VARCHAR(32)  NULL,               -- derived attention state at generation
  dedupe_key      VARCHAR(191) NOT NULL,           -- (type|related_record) — one live surface per concern
  request_id      VARCHAR(191) NULL,
  created_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY k_nh_type (notification_type),
  KEY k_nh_related (related_record),
  UNIQUE KEY u_nh_dedupe (dedupe_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO schema_migrations (version) VALUES ('0005_phase9') ON DUPLICATE KEY UPDATE version = version;
