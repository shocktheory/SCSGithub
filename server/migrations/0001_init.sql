-- SCS initial schema (Phase 5) — MySQL 8.0+ / InnoDB / utf8mb4.
-- One table per governed collection (23). Each row = full typed record as JSON `data` plus
-- server-owned persistence metadata (authority_status, is_demonstration, version, timestamps,
-- archived). Indexed/foreign columns are STORED generated columns extracted from `data`, so the
-- generic repository writes only `data` while the database still enforces integrity.
--
-- Integrity per Phase 4 matrix: hard FKs where structural; intentional SOFT references (indexed,
-- no FK) for pending-canonical-id links and append-only Operational History. No new constitutional
-- entities/concepts are introduced (architecture freeze) — this is a persistence substrate only.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     VARCHAR(64) NOT NULL PRIMARY KEY,
  applied_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---- Reusable column set (documented once; repeated per table) ----------------------------
--   id VARCHAR(191) PK, data JSON, authority_status VARCHAR(32), is_demonstration TINYINT,
--   version INT UNSIGNED, created_at/updated_at DATETIME(6), archived TINYINT, KEY(authority_status)

-- ===== Referenced-first tables (no outgoing hard FK) =======================================
CREATE TABLE IF NOT EXISTS ai_collaborators (
  id VARCHAR(191) NOT NULL PRIMARY KEY, data JSON NOT NULL,
  authority_status VARCHAR(32) NOT NULL DEFAULT 'reported', is_demonstration TINYINT(1) NOT NULL DEFAULT 0,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  archived TINYINT(1) NOT NULL DEFAULT 0, KEY k_ai_auth (authority_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS decisions (
  id VARCHAR(191) NOT NULL PRIMARY KEY, data JSON NOT NULL,
  decision_id VARCHAR(191) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data,'$.decisionId'))) STORED,
  authority_status VARCHAR(32) NOT NULL DEFAULT 'reported', is_demonstration TINYINT(1) NOT NULL DEFAULT 0,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  archived TINYINT(1) NOT NULL DEFAULT 0, KEY k_dec_auth (authority_status), KEY k_dec_canon (decision_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS gates (
  id VARCHAR(191) NOT NULL PRIMARY KEY, data JSON NOT NULL,
  authority_status VARCHAR(32) NOT NULL DEFAULT 'reported', is_demonstration TINYINT(1) NOT NULL DEFAULT 0,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  archived TINYINT(1) NOT NULL DEFAULT 0, KEY k_gate_auth (authority_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS teams (
  id VARCHAR(191) NOT NULL PRIMARY KEY, data JSON NOT NULL,
  authority_status VARCHAR(32) NOT NULL DEFAULT 'reported', is_demonstration TINYINT(1) NOT NULL DEFAULT 0,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  archived TINYINT(1) NOT NULL DEFAULT 0, KEY k_team_auth (authority_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===== Constitutional-trace tables (hard FKs + intentional soft refs) =======================
CREATE TABLE IF NOT EXISTS standing_directives (
  id VARCHAR(191) NOT NULL PRIMARY KEY, data JSON NOT NULL,
  agent VARCHAR(191) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data,'$.agent'))) STORED,
  governing_decision VARCHAR(191) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data,'$.governingDecision'))) STORED,
  authority_status VARCHAR(32) NOT NULL DEFAULT 'reported', is_demonstration TINYINT(1) NOT NULL DEFAULT 0,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  archived TINYINT(1) NOT NULL DEFAULT 0,
  KEY k_sd_auth (authority_status), KEY k_sd_agent (agent), KEY k_sd_dec (governing_decision),
  CONSTRAINT fk_sd_agent FOREIGN KEY (agent) REFERENCES ai_collaborators(id),
  CONSTRAINT fk_sd_decision FOREIGN KEY (governing_decision) REFERENCES decisions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS deliverables (
  id VARCHAR(191) NOT NULL PRIMARY KEY, data JSON NOT NULL,
  review_gate VARCHAR(191) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data,'$.reviewGate'))) STORED,
  assignment_directive VARCHAR(191) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data,'$.assignmentDirective'))) STORED,
  authority_status VARCHAR(32) NOT NULL DEFAULT 'reported', is_demonstration TINYINT(1) NOT NULL DEFAULT 0,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  archived TINYINT(1) NOT NULL DEFAULT 0,
  KEY k_dlv_auth (authority_status), KEY k_dlv_adr (assignment_directive),
  -- review_gate is a hard FK; assignment_directive is a SOFT index (breaks the ADR<->DLV cycle).
  CONSTRAINT fk_dlv_gate FOREIGN KEY (review_gate) REFERENCES gates(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS assignment_directives (
  id VARCHAR(191) NOT NULL PRIMARY KEY, data JSON NOT NULL,
  agent VARCHAR(191) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data,'$.agent'))) STORED,
  standing_directive VARCHAR(191) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data,'$.standingDirective'))) STORED,
  deliverable VARCHAR(191) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data,'$.deliverable'))) STORED,
  review_gate VARCHAR(191) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data,'$.reviewGate'))) STORED,
  -- product_owner_decision is a SOFT reference: canonical ST-DEC ids may be Product-Owner-pending.
  product_owner_decision VARCHAR(191) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data,'$.productOwnerDecision'))) STORED,
  authority_status VARCHAR(32) NOT NULL DEFAULT 'reported', is_demonstration TINYINT(1) NOT NULL DEFAULT 0,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  archived TINYINT(1) NOT NULL DEFAULT 0,
  KEY k_adr_auth (authority_status), KEY k_adr_po (product_owner_decision),
  CONSTRAINT fk_adr_agent FOREIGN KEY (agent) REFERENCES ai_collaborators(id),
  CONSTRAINT fk_adr_sd FOREIGN KEY (standing_directive) REFERENCES standing_directives(id),
  CONSTRAINT fk_adr_dlv FOREIGN KEY (deliverable) REFERENCES deliverables(id),
  CONSTRAINT fk_adr_gate FOREIGN KEY (review_gate) REFERENCES gates(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS team_memberships (
  id VARCHAR(191) NOT NULL PRIMARY KEY, data JSON NOT NULL,
  agent VARCHAR(191) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data,'$.agent'))) STORED,
  team VARCHAR(191) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data,'$.team'))) STORED,
  authority_status VARCHAR(32) NOT NULL DEFAULT 'reported', is_demonstration TINYINT(1) NOT NULL DEFAULT 0,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  archived TINYINT(1) NOT NULL DEFAULT 0,
  KEY k_tm_auth (authority_status), KEY k_tm_agent (agent), KEY k_tm_team (team),
  -- agent references a governed agent id (po-sonja is the Product Owner, not in ai_collaborators),
  -- so agent is a SOFT index here; team is a hard FK.
  CONSTRAINT fk_tm_team FOREIGN KEY (team) REFERENCES teams(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS operational_history (
  id VARCHAR(191) NOT NULL PRIMARY KEY, data JSON NOT NULL,
  agent VARCHAR(191) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data,'$.agent'))) STORED,
  -- related_object is a SOFT reference: append-only evidence must survive supersession of its referent.
  related_object VARCHAR(191) GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(data,'$.relatedObject'))) STORED,
  authority_status VARCHAR(32) NOT NULL DEFAULT 'reported', is_demonstration TINYINT(1) NOT NULL DEFAULT 0,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  archived TINYINT(1) NOT NULL DEFAULT 0,
  KEY k_oph_auth (authority_status), KEY k_oph_agent (agent), KEY k_oph_rel (related_object)
  -- append-only in production (INSERT/SELECT grants only; no UPDATE/DELETE).
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===== Generic collections (common columns; no outgoing hard FK) ============================
CREATE TABLE IF NOT EXISTS os_systems         (id VARCHAR(191) NOT NULL PRIMARY KEY, data JSON NOT NULL, authority_status VARCHAR(32) NOT NULL DEFAULT 'reported', is_demonstration TINYINT(1) NOT NULL DEFAULT 0, version INT UNSIGNED NOT NULL DEFAULT 1, created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), archived TINYINT(1) NOT NULL DEFAULT 0, KEY k_os_auth (authority_status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS products           (id VARCHAR(191) NOT NULL PRIMARY KEY, data JSON NOT NULL, authority_status VARCHAR(32) NOT NULL DEFAULT 'reported', is_demonstration TINYINT(1) NOT NULL DEFAULT 0, version INT UNSIGNED NOT NULL DEFAULT 1, created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), archived TINYINT(1) NOT NULL DEFAULT 0, KEY k_prod_auth (authority_status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS publications       (id VARCHAR(191) NOT NULL PRIMARY KEY, data JSON NOT NULL, authority_status VARCHAR(32) NOT NULL DEFAULT 'reported', is_demonstration TINYINT(1) NOT NULL DEFAULT 0, version INT UNSIGNED NOT NULL DEFAULT 1, created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), archived TINYINT(1) NOT NULL DEFAULT 0, KEY k_pub_auth (authority_status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS publication_phases  (id VARCHAR(191) NOT NULL PRIMARY KEY, data JSON NOT NULL, authority_status VARCHAR(32) NOT NULL DEFAULT 'reported', is_demonstration TINYINT(1) NOT NULL DEFAULT 0, version INT UNSIGNED NOT NULL DEFAULT 1, created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), archived TINYINT(1) NOT NULL DEFAULT 0, KEY k_pp_auth (authority_status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS canonical_statements(id VARCHAR(191) NOT NULL PRIMARY KEY, data JSON NOT NULL, authority_status VARCHAR(32) NOT NULL DEFAULT 'reported', is_demonstration TINYINT(1) NOT NULL DEFAULT 0, version INT UNSIGNED NOT NULL DEFAULT 1, created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), archived TINYINT(1) NOT NULL DEFAULT 0, KEY k_cs_auth (authority_status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS canonical_concepts  (id VARCHAR(191) NOT NULL PRIMARY KEY, data JSON NOT NULL, authority_status VARCHAR(32) NOT NULL DEFAULT 'reported', is_demonstration TINYINT(1) NOT NULL DEFAULT 0, version INT UNSIGNED NOT NULL DEFAULT 1, created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), archived TINYINT(1) NOT NULL DEFAULT 0, KEY k_cc_auth (authority_status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS assignments        (id VARCHAR(191) NOT NULL PRIMARY KEY, data JSON NOT NULL, authority_status VARCHAR(32) NOT NULL DEFAULT 'reported', is_demonstration TINYINT(1) NOT NULL DEFAULT 0, version INT UNSIGNED NOT NULL DEFAULT 1, created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), archived TINYINT(1) NOT NULL DEFAULT 0, KEY k_asn_auth (authority_status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS benchmarks         (id VARCHAR(191) NOT NULL PRIMARY KEY, data JSON NOT NULL, authority_status VARCHAR(32) NOT NULL DEFAULT 'reported', is_demonstration TINYINT(1) NOT NULL DEFAULT 0, version INT UNSIGNED NOT NULL DEFAULT 1, created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), archived TINYINT(1) NOT NULL DEFAULT 0, KEY k_bm_auth (authority_status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS risks              (id VARCHAR(191) NOT NULL PRIMARY KEY, data JSON NOT NULL, authority_status VARCHAR(32) NOT NULL DEFAULT 'reported', is_demonstration TINYINT(1) NOT NULL DEFAULT 0, version INT UNSIGNED NOT NULL DEFAULT 1, created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), archived TINYINT(1) NOT NULL DEFAULT 0, KEY k_risk_auth (authority_status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS updates            (id VARCHAR(191) NOT NULL PRIMARY KEY, data JSON NOT NULL, authority_status VARCHAR(32) NOT NULL DEFAULT 'reported', is_demonstration TINYINT(1) NOT NULL DEFAULT 0, version INT UNSIGNED NOT NULL DEFAULT 1, created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), archived TINYINT(1) NOT NULL DEFAULT 0, KEY k_upd_auth (authority_status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS artifacts          (id VARCHAR(191) NOT NULL PRIMARY KEY, data JSON NOT NULL, authority_status VARCHAR(32) NOT NULL DEFAULT 'reported', is_demonstration TINYINT(1) NOT NULL DEFAULT 0, version INT UNSIGNED NOT NULL DEFAULT 1, created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), archived TINYINT(1) NOT NULL DEFAULT 0, KEY k_art_auth (authority_status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS review_items        (id VARCHAR(191) NOT NULL PRIMARY KEY, data JSON NOT NULL, authority_status VARCHAR(32) NOT NULL DEFAULT 'reported', is_demonstration TINYINT(1) NOT NULL DEFAULT 0, version INT UNSIGNED NOT NULL DEFAULT 1, created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), archived TINYINT(1) NOT NULL DEFAULT 0, KEY k_ri_auth (authority_status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS next_actions        (id VARCHAR(191) NOT NULL PRIMARY KEY, data JSON NOT NULL, authority_status VARCHAR(32) NOT NULL DEFAULT 'reported', is_demonstration TINYINT(1) NOT NULL DEFAULT 0, version INT UNSIGNED NOT NULL DEFAULT 1, created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), archived TINYINT(1) NOT NULL DEFAULT 0, KEY k_na_auth (authority_status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS relationships       (id VARCHAR(191) NOT NULL PRIMARY KEY, data JSON NOT NULL, authority_status VARCHAR(32) NOT NULL DEFAULT 'reported', is_demonstration TINYINT(1) NOT NULL DEFAULT 0, version INT UNSIGNED NOT NULL DEFAULT 1, created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), archived TINYINT(1) NOT NULL DEFAULT 0, KEY k_rel_auth (authority_status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
INSERT INTO schema_migrations (version) VALUES ('0001_init') ON DUPLICATE KEY UPDATE version = version;
