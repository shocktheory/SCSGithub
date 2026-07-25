<?php
declare(strict_types=1);

/**
 * SCS governed persistence API — entry point (Phase 5).
 *
 * Thin Slim 4 JSON API over MySQL. Backend foundation & persistence only:
 *  - collection reads, governed `upsert` command (optimistic concurrency + idempotency),
 *    dev delete, guarded reset, validated import, and a server-side derivation SEAM.
 *
 * NOT in Phase 5 (guarded/absent): production authentication, email, Web Push, confidential
 * data, deployment. `SCS_ENV` must be development/test; production is refused.
 *
 * NOTE: not executed in the authoring environment (no PHP/MySQL). Runtime validation is a
 * host-verification item — see PHASE_5_IMPLEMENTATION.md §Hosting Capability Verification.
 */

require __DIR__ . '/../vendor/autoload.php';

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use Scs\Config;
use Scs\Database;
use Scs\Repository;
use Scs\Commands;
use Scs\Importer;
use Scs\Http;

$config = Config::fromEnv();
if ($config->env === 'production') {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Phase 5 is not authorized for production. Set SCS_ENV=development|test.']);
    exit;
}

$db   = new Database($config);
$repo = new Repository($db);
$cmd  = new Commands($repo);
$import = new Importer($repo, $config);

$app = AppFactory::create();
$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();
// Structured error handler (JSON, no HTML leaks).
$errorMiddleware = $app->addErrorMiddleware($config->env !== 'production', true, true);
$errorMiddleware->setDefaultErrorHandler(Http::errorHandler());

/** Health check. */
$app->get('/api/health', fn(Request $r, Response $s) =>
    Http::json($s, ['status' => 'ok', 'env' => $config->env, 'schemaVersion' => Repository::SCHEMA_VERSION]));

/** Server-side canonical derivation SEAM (Phase 5). Never trusts a client snapshot.
 *  Full PHP port is sequenced (see report); this proves the location + version stamping. */
$app->get('/api/derived/{view}', fn(Request $r, Response $s, array $a) =>
    Http::json($s, ['view' => $a['view'], 'derivationVersion' => $config->derivationVersion, 'source' => 'server', 'note' => 'derivation-foundation-seam']));

/** Collection reads. */
$app->get('/api/{collection}', function (Request $r, Response $s, array $a) use ($repo) {
    Http::assertCollection($a['collection']);
    return Http::json($s, ['items' => $repo->list($a['collection'])]);
});
$app->get('/api/{collection}/{id}', function (Request $r, Response $s, array $a) use ($repo) {
    Http::assertCollection($a['collection']);
    $row = $repo->get($a['collection'], $a['id']);
    return $row ? Http::json($s, $row) : Http::json($s->withStatus(404), ['error' => 'not found']);
});

/** Governed commands. Authority changes never happen via raw document replacement. */
$app->post('/api/commands/{command}', function (Request $r, Response $s, array $a) use ($cmd) {
    return $cmd->handle($a['command'], (array)$r->getParsedBody(), $s);
});

/** Dev/test delete (restricted; production uses archive/supersede commands). */
$app->delete('/api/{collection}/{id}', function (Request $r, Response $s, array $a) use ($repo) {
    Http::assertCollection($a['collection']);
    $repo->delete($a['collection'], $a['id']);
    return Http::json($s, ['ok' => true]);
});

/** Admin: validated import, export, guarded reset. */
$app->post('/api/admin/import', fn(Request $r, Response $s) => $import->run((array)$r->getParsedBody(), $s));
$app->get('/api/admin/export', fn(Request $r, Response $s) => Http::json($s, $repo->exportWorkspace()));
$app->post('/api/admin/reset', function (Request $r, Response $s) use ($repo, $config) {
    $token = (string)(((array)$r->getParsedBody())['confirmationToken'] ?? '');
    if ($token !== $config->resetToken) return Http::json($s->withStatus(400), ['error' => 'missing confirmation token']);
    $repo->resetAll();
    return Http::json($s, ['ok' => true]);
});

$app->run();
