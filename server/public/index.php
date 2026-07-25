<?php
declare(strict_types=1);

/**
 * SCS governed persistence + identity API — entry point.
 *
 * Phase 5: persistence, governed upsert, import/export, guarded reset, derivation seam.
 * Phase 6: Identity (auth/sessions/MFA), Authority (roles/permissions/approval boundary),
 *          Trust (authenticated attribution). Native identity only; no external IdP; no JWT.
 *
 * NOT in scope: notifications, hosting, deployment, confidential data, full Technical Audit Log
 * (Phase 8), production. `SCS_ENV` must be development/test; production is refused.
 *
 * NOTE: not executed in the authoring environment (no PHP/MySQL). Runtime validation is via CI.
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
use Scs\Auth;
use Scs\Totp;
use Scs\Http;

$config = Config::fromEnv();
if ($config->env === 'production') {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Phase 5/6 is not authorized for production. Set SCS_ENV=development|test.']);
    exit;
}

$db   = new Database($config);
$repo = new Repository($db);
$auth = new Auth($db);
$cmd  = new Commands($repo, $auth);
$import = new Importer($repo, $config);

/** Resolve the authenticated actor (if any) from the session cookie. Never throws. */
$resolveActor = static function (Request $r) use ($auth): ?array {
    try {
        $sid = $r->getCookieParams()['scs_session'] ?? null;
        return $auth->resolveActor(is_string($sid) ? $sid : null);
    } catch (\Throwable) {
        return null; // auth tables may not exist before migration 0002
    }
};
$reqId = static fn(Request $r): ?string => $r->getHeaderLine('X-Request-Id') ?: null;
$sessionCookie = static function (Response $s, string $sid): Response {
    // HttpOnly, Secure, SameSite=Strict server-managed session (no JWT).
    return $s->withHeader('Set-Cookie', "scs_session={$sid}; Path=/; HttpOnly; Secure; SameSite=Strict");
};

$app = AppFactory::create();
$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();
$errorMiddleware = $app->addErrorMiddleware($config->env !== 'production', true, true);
$errorMiddleware->setDefaultErrorHandler(Http::errorHandler());

/** Health. */
$app->get('/api/health', fn(Request $r, Response $s) =>
    Http::json($s, ['status' => 'ok', 'env' => $config->env, 'schemaVersion' => Repository::SCHEMA_VERSION]));

/** Server-side canonical derivation seam (never trusts a client snapshot). */
$app->get('/api/derived/{view}', fn(Request $r, Response $s, array $a) =>
    Http::json($s, ['view' => $a['view'], 'derivationVersion' => $config->derivationVersion, 'source' => 'server', 'note' => 'derivation-foundation-seam']));

// ===== Identity / auth =====================================================================
$app->post('/api/auth/login', function (Request $r, Response $s) use ($auth, $reqId, $sessionCookie) {
    $b = (array)$r->getParsedBody();
    try {
        $res = $auth->login((string)($b['email'] ?? ''), (string)($b['password'] ?? ''), isset($b['totp']) ? (string)$b['totp'] : null, $reqId($r));
    } catch (\RuntimeException $e) {
        $code = $e->getMessage() === 'mfa_required' ? 401 : ($e->getMessage() === 'locked' ? 423 : 401);
        return Http::json($s->withStatus($code), ['error' => $e->getMessage()]);
    }
    return $sessionCookie(Http::json($s, ['sessionId' => $res['sessionId'], 'csrfToken' => $res['csrfToken'], 'user' => $res['user'], 'mfaVerified' => $res['mfaVerified']]), $res['sessionId']);
});
$app->post('/api/auth/logout', function (Request $r, Response $s) use ($auth, $resolveActor) {
    $actor = $resolveActor($r);
    if ($actor) $auth->revoke($actor['sessionId']);
    return Http::json($s->withHeader('Set-Cookie', 'scs_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'), ['ok' => true]);
});
$app->get('/api/auth/session', function (Request $r, Response $s) use ($resolveActor) {
    $actor = $resolveActor($r);
    return $actor
        ? Http::json($s, ['authenticated' => true, 'actor' => ['id' => $actor['id'], 'email' => $actor['email'], 'role' => $actor['role'], 'mfaVerified' => $actor['mfaVerified']], 'csrfToken' => $actor['csrf']])
        : Http::json($s, ['authenticated' => false]);
});
$app->post('/api/auth/recover', function (Request $r, Response $s) use ($auth) {
    $b = (array)$r->getParsedBody();
    if (isset($b['token'], $b['newPassword'])) {
        return Http::json($s, ['ok' => $auth->consumeRecovery((string)$b['token'], (string)$b['newPassword'])]);
    }
    // Request a token (dev/test returns it directly; production would email it).
    $user = $auth->findByEmail((string)($b['email'] ?? ''));
    return Http::json($s, ['token' => $user ? $auth->createRecoveryToken($user['id']) : null]);
});
/** Dev/test only: seed the standard identities and return the Product Owner MFA secret. */
$app->post('/api/auth/dev-seed', function (Request $r, Response $s) use ($auth, $config) {
    if (!in_array($config->env, ['development', 'test'], true)) return Http::json($s->withStatus(403), ['error' => 'dev-seed disabled']);
    $poSecret = Totp::generateSecret();
    if (!$auth->findByEmail('po@scs.test')) $auth->createUser('po@scs.test', 'po-password', 'product_owner', $poSecret);
    else { $u = $auth->findByEmail('po@scs.test'); $poSecret = $u['mfa_secret'] ?? $poSecret; }
    if (!$auth->findByEmail('admin@scs.test')) $auth->createUser('admin@scs.test', 'admin-password', 'administrator');
    if (!$auth->findByEmail('agent@scs.test')) $auth->createUser('agent@scs.test', 'agent-password', 'agent');
    return Http::json($s, ['seeded' => true, 'poMfaSecret' => $poSecret]);
});

// ===== Governed commands (actor-aware; CSRF enforced for authenticated writes) =============
$app->post('/api/commands/{command}', function (Request $r, Response $s, array $a) use ($cmd, $resolveActor, $reqId) {
    $actor = $resolveActor($r);
    if ($actor !== null) {
        $csrf = $r->getHeaderLine('X-CSRF-Token');
        if (!hash_equals((string)$actor['csrf'], $csrf)) {
            return Http::json($s->withStatus(403), ['error' => 'invalid or missing CSRF token']);
        }
    }
    return $cmd->handle($a['command'], (array)$r->getParsedBody(), $s, $actor, $reqId($r));
});

// ===== Admin (static routes BEFORE the generic /api/{collection} variable routes) ===========
$app->post('/api/admin/import', fn(Request $r, Response $s) => $import->run((array)$r->getParsedBody(), $s));
$app->get('/api/admin/export', fn(Request $r, Response $s) => Http::json($s, $repo->exportWorkspace()));
$app->post('/api/admin/reset', function (Request $r, Response $s) use ($repo, $config) {
    $token = (string)(((array)$r->getParsedBody())['confirmationToken'] ?? '');
    if ($token !== $config->resetToken) return Http::json($s->withStatus(400), ['error' => 'missing confirmation token']);
    $repo->resetAll();
    return Http::json($s, ['ok' => true]);
});

// ===== Generic collection reads / dev delete (variable routes — registered LAST) ============
$app->get('/api/{collection}', function (Request $r, Response $s, array $a) use ($repo) {
    Http::assertCollection($a['collection']);
    return Http::json($s, ['items' => $repo->list($a['collection'])]);
});
$app->get('/api/{collection}/{id}', function (Request $r, Response $s, array $a) use ($repo) {
    Http::assertCollection($a['collection']);
    $row = $repo->get($a['collection'], $a['id']);
    return $row ? Http::json($s, $row) : Http::json($s->withStatus(404), ['error' => 'not found']);
});
$app->delete('/api/{collection}/{id}', function (Request $r, Response $s, array $a) use ($repo) {
    Http::assertCollection($a['collection']);
    $repo->delete($a['collection'], $a['id']);
    return Http::json($s, ['ok' => true]);
});

$app->run();
