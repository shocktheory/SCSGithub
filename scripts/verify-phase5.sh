#!/usr/bin/env bash
# One-command Phase 5 host runtime verification (dev/test only; synthetic data only).
# Requires: PHP 8.2+, Composer, MySQL 8 (or `docker compose`), Node + the app toolchain.
# This performs the runtime verification the Product Owner required. It NEVER deploys, uses no
# confidential data, and refuses production (the backend rejects SCS_ENV=production).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export SCS_ENV="${SCS_ENV:-test}"
export DB_DSN="${DB_DSN:-mysql:host=127.0.0.1;port=3306;dbname=scs_test;charset=utf8mb4}"
export DB_USER="${DB_USER:-root}"
export DB_PASSWORD="${DB_PASSWORD:-root}"
export RESET_TOKEN="${RESET_TOKEN:-CONFIRM-RESET}"

echo "== PHP syntax =="; find "$ROOT/server" -name '*.php' -print0 | while IFS= read -r -d '' f; do php -l "$f"; done
echo "== Composer =="; (cd "$ROOT/server" && (composer install --no-interaction 2>/dev/null || composer update --no-interaction))
echo "== Migrations =="; (cd "$ROOT/server" && php migrations/migrate.php && php migrations/migrate.php status)
echo "== PHPUnit =="; (cd "$ROOT/server" && vendor/bin/phpunit --colors=never)
echo "== Boot backend =="; (cd "$ROOT/server" && php -S 127.0.0.1:8787 -t public public/index.php >/tmp/scs-server.log 2>&1 &) ; sleep 2
for i in $(seq 1 20); do curl -sf http://127.0.0.1:8787/api/health && break || sleep 1; done
echo "== Frontend + E2E parity vs real backend =="
(cd "$ROOT/app" && npm ci && npx tsc -p tsconfig.app.json --noEmit && npx vitest run && SCS_E2E_BASE=http://127.0.0.1:8787 npx vitest run tests/remoteAdapter.e2e.test.ts && npx vite build)
echo "== Phase 5 runtime verification complete =="
