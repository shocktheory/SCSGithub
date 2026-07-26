-- SCS Phase 7 — Server-Side Constitutional Derivation & Canonical State Authority.
-- Adds a derivations store for replay / historical derivation / drift detection. The derivation
-- engine (Scs\Derivation) is the canonical authority; this table persists its outputs keyed by
-- (view, input_hash, derivation_version) so a deterministic re-derivation can be compared to a
-- recorded output (drift detection) and any prior constitutional state can be replayed.
--
-- No new constitutional entities are introduced. Governed records are unchanged; this is a
-- derivation-substrate table only. Not authorized for production (SCS_ENV must be development/test).

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS derivations (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  view               VARCHAR(64)  NOT NULL,
  input_hash         CHAR(64)     NOT NULL,
  derivation_version VARCHAR(32)  NOT NULL,
  schema_version     VARCHAR(32)  NOT NULL,
  output             JSON         NOT NULL,
  created_at         DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY u_view_hash_ver (view, input_hash, derivation_version),
  KEY k_deriv_view (view)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO schema_migrations (version) VALUES ('0003_phase7') ON DUPLICATE KEY UPDATE version = version;
