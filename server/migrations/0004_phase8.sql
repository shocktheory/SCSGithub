-- SCS Phase 8 — Constitutional Observability (Technical Audit Log + Constitutional Evidence).
--
-- audit_log: the Technical Audit Log — immutable, APPEND-ONLY, tamper-evident. Every governed
-- command execution (applied or rejected), derivation run, and security event is recorded with the
-- authenticated actor, request/correlation ids, command/derivation/evidence references, outcome, and
-- a hash-chain (prev_hash -> event_hash) that makes any alteration or omission independently
-- detectable. It observes constitutional activity; it never becomes constitutional authority. In
-- production the app is granted INSERT/SELECT only (no UPDATE/DELETE) — append-only.
--
-- evidence: the Constitutional Evidence store — a governed collection (flows through the same
-- Repository/Commands lifecycle). Evidence supports constitutional decisions; it never becomes
-- authority, and is immutable once accepted (enforced in the command layer).
--
-- Not authorized for production (SCS_ENV must be development/test). No confidential data.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS audit_log (
  seq                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  event_type         VARCHAR(64)  NOT NULL,
  occurred_at        DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  actor_id           VARCHAR(191) NULL,
  actor_role         VARCHAR(32)  NOT NULL DEFAULT 'anon',
  request_id         VARCHAR(191) NULL,
  correlation_id     VARCHAR(191) NULL,
  command_ref        JSON         NULL,
  derivation_ref     JSON         NULL,
  evidence_ref       VARCHAR(191) NULL,
  outcome            VARCHAR(32)  NOT NULL,             -- applied | rejected | observed
  reason             VARCHAR(255) NULL,
  prev_hash          CHAR(64)     NOT NULL,
  event_hash         CHAR(64)     NOT NULL,
  KEY k_audit_actor (actor_id),
  KEY k_audit_type (event_type),
  KEY k_audit_corr (correlation_id),
  UNIQUE KEY u_audit_hash (event_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS evidence (
  id VARCHAR(191) NOT NULL PRIMARY KEY, data JSON NOT NULL,
  authority_status VARCHAR(32) NOT NULL DEFAULT 'reported', is_demonstration TINYINT(1) NOT NULL DEFAULT 0,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  archived TINYINT(1) NOT NULL DEFAULT 0, KEY k_ev_auth (authority_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO schema_migrations (version) VALUES ('0004_phase8') ON DUPLICATE KEY UPDATE version = version;
