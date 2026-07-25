-- Phase 6 — Identity, Authority & Trust foundation (MySQL 8 / InnoDB).
-- Users, DB-backed sessions, recovery tokens, a mutation-attribution seam, and auth events.
-- NOT the full Technical Audit Log (that is Phase 8) — only the Phase-6 attribution seam.
-- No confidential data; dev/test only in this phase.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(191) NOT NULL PRIMARY KEY,
  email         VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(32)  NOT NULL,               -- product_owner | administrator | agent | service
  mfa_secret    VARCHAR(64)  NULL,                   -- base32 TOTP secret (null = no MFA enrolled)
  status        VARCHAR(24)  NOT NULL DEFAULT 'active',
  failed_logins INT UNSIGNED NOT NULL DEFAULT 0,
  locked_until  DATETIME(6)  NULL,
  created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  KEY k_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS sessions (
  id           VARCHAR(191) NOT NULL PRIMARY KEY,     -- opaque server session id (NOT a JWT)
  user_id      VARCHAR(191) NOT NULL,
  csrf_token   VARCHAR(191) NOT NULL,
  mfa_verified TINYINT(1)   NOT NULL DEFAULT 0,
  mfa_verified_at DATETIME(6) NULL,
  created_at   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  last_seen_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  expires_at   DATETIME(6)  NOT NULL,
  rotated_from VARCHAR(191) NULL,
  revoked      TINYINT(1)   NOT NULL DEFAULT 0,
  KEY k_sess_user (user_id),
  CONSTRAINT fk_sess_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS recovery_tokens (
  token      VARCHAR(191) NOT NULL PRIMARY KEY,
  user_id    VARCHAR(191) NOT NULL,
  expires_at DATETIME(6)  NOT NULL,
  used       TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_rec_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Attribution seam (Phase 6): who did what, with a request id. Append-only in spirit.
CREATE TABLE IF NOT EXISTS mutation_attributions (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  collection VARCHAR(64)  NULL,
  record_id  VARCHAR(191) NULL,
  actor_id   VARCHAR(191) NULL,
  actor_role VARCHAR(32)  NULL,
  request_id VARCHAR(191) NULL,
  action     VARCHAR(48)  NOT NULL,
  created_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY k_attr_record (collection, record_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS auth_events (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id    VARCHAR(191) NULL,
  event      VARCHAR(48)  NOT NULL,                   -- login|login_failed|logout|lockout|recovery|mfa_required|approve
  request_id VARCHAR(191) NULL,
  detail     VARCHAR(255) NULL,
  created_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO schema_migrations (version) VALUES ('0002_auth') ON DUPLICATE KEY UPDATE version = version;
