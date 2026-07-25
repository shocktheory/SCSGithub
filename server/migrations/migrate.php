<?php
declare(strict_types=1);

/**
 * Deterministic migration runner (Phase 5).
 *   php migrations/migrate.php            # apply pending migrations
 *   php migrations/migrate.php status     # list applied vs pending
 *   php migrations/migrate.php reset       # DEV/TEST ONLY: drop schema + reapply (refuses in production)
 *
 * Migrations are ordered .sql files (NNNN_name.sql), tracked in schema_migrations, safe for a
 * fresh environment. Never run against confidential or production data in Phase 5.
 *
 * Not executed in the authoring environment (no PHP/MySQL). Host-verification item.
 */

require __DIR__ . '/../vendor/autoload.php';
use Scs\Config;
use Scs\Database;

$config = Config::fromEnv();
if ($config->env === 'production') { fwrite(STDERR, "refused: migrations are not authorized for production in Phase 5\n"); exit(2); }

$cmd = $argv[1] ?? 'apply';
$db = new Database($config);
$pdo = $db->pdo();

$files = glob(__DIR__ . '/*.sql');
sort($files);
$versions = array_map(fn($f) => basename($f, '.sql'), $files);

$pdo->exec("CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(64) NOT NULL PRIMARY KEY, applied_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6))");
$applied = $pdo->query('SELECT version FROM schema_migrations')->fetchAll(PDO::FETCH_COLUMN) ?: [];

if ($cmd === 'status') {
    foreach ($versions as $v) echo (in_array($v, $applied, true) ? '[x] ' : '[ ] ') . $v . "\n";
    exit(0);
}

if ($cmd === 'reset') {
    // Dev/test convenience: drop all known tables, then reapply from scratch.
    $pdo->exec('SET FOREIGN_KEY_CHECKS=0');
    foreach (\Scs\Http::COLLECTIONS as $c) {
        $t = strtolower(preg_replace('/([a-z])([A-Z])/', '$1_$2', $c));
        $pdo->exec("DROP TABLE IF EXISTS `{$t}`");
    }
    $pdo->exec('DROP TABLE IF EXISTS schema_migrations');
    $pdo->exec('SET FOREIGN_KEY_CHECKS=1');
    $pdo->exec("CREATE TABLE schema_migrations (version VARCHAR(64) NOT NULL PRIMARY KEY, applied_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6))");
    $applied = [];
    echo "schema dropped; reapplying\n";
}

foreach ($files as $i => $file) {
    $version = $versions[$i];
    if (in_array($version, $applied, true)) continue;
    echo "applying {$version} ... ";
    $sql = file_get_contents($file);
    $pdo->exec($sql); // migration files record themselves into schema_migrations
    echo "ok\n";
}
echo "migrations up to date\n";
