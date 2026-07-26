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
use Scs\Derivation;
use Scs\VersionException;
use Scs\Audit;
use Scs\Operations;
use Scs\Notifications;

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
$audit = new Audit($db); // Phase 8: Technical Audit Log (observes governed activity; never authority)
$cmd  = new Commands($repo, $auth, $audit);
$import = new Importer($repo, $config);
$derive = new Derivation(); // Phase 7: canonical derivation engine (owns its derivation_version)
$ops = new Operations();          // Phase 9: operational awareness (derived, read-only; never authority)
$notify = new Notifications($db); // Phase 9: Notification History (append-only, distinct stream)

/** Load the authoritative collections needed for constitutional derivation (records only). */
$loadCollections = static function () use ($repo): array {
    $out = [];
    foreach (['aiCollaborators','decisions','standingDirectives','assignmentDirectives','operationalHistory','teams','teamMemberships','deliverables','gates','evidence'] as $c) {
        $out[$c] = array_map(static fn($r) => $r['record'], $repo->list($c));
    }
    return $out;
};

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

// ===== Phase 7: Server-side canonical constitutional derivation ============================
// The server is the sole derivation authority. It never trusts a client-computed snapshot; it
// derives from the authoritative records it persists. Outputs are versioned, hashed, explainable.

/** Derivation version surface (schema_version and derivation_version are independent). */
$app->get('/api/derivation/version', fn(Request $r, Response $s) =>
    Http::json($s, ['derivationVersion' => $derive->derivationVersion(), 'schemaVersion' => $derive->schemaVersion(), 'source' => 'server']));

/** Whole-team constitutional derivation from the authoritative records (canonical). */
$app->get('/api/derived/team', function (Request $r, Response $s) use ($derive, $loadCollections, $repo) {
    $collections = $loadCollections();
    $output = $derive->deriveTeam($collections);
    $hash = $derive->inputHash($collections);
    $repo->saveDerivation('team', $hash, $derive->derivationVersion(), $derive->schemaVersion(), $output);
    return Http::json($s, [
        'view' => 'team', 'source' => 'server',
        'derivationVersion' => $derive->derivationVersion(), 'schemaVersion' => $derive->schemaVersion(),
        'inputHash' => $hash, 'output' => $output,
    ]);
});

/**
 * Derive a single agent's constitutional state from an explicit evidence input. This is the pure
 * derivation surface used for client/server parity (identical input → identical output) and for
 * replay. The client may PROPOSE an input to be derived; it never authors the derived output.
 */
$app->post('/api/derived/agent-state', function (Request $r, Response $s) use ($derive, $repo) {
    $b = (array)$r->getParsedBody();
    $input = is_array($b['input'] ?? null) ? $b['input'] : $b;
    try {
        $derive->assertCompatible(isset($b['derivationVersion']) ? (string)$b['derivationVersion'] : null,
                                  isset($b['schemaVersion']) ? (string)$b['schemaVersion'] : null);
    } catch (VersionException $e) {
        return Http::json($s->withStatus(409), ['error' => $e->getMessage(), 'derivationVersion' => $derive->derivationVersion(), 'schemaVersion' => $derive->schemaVersion()]);
    }
    $output = $derive->deriveAgentState($input);
    $hash = $derive->inputHash($input);
    $repo->saveDerivation('agent-state', $hash, $derive->derivationVersion(), $derive->schemaVersion(), $output);
    return Http::json($s, [
        'view' => 'agent-state', 'source' => 'server',
        'derivationVersion' => $derive->derivationVersion(), 'schemaVersion' => $derive->schemaVersion(),
        'inputHash' => $hash, 'state' => $output,
    ]);
});

/**
 * Deterministic replay: recompute a derivation from an explicit input at a derivation version and
 * report whether it reproduces the recorded output (drift detection). A version/schema mismatch is
 * a predictable 409 (mandatory regression). Only 'agent-state' and 'team' views are replayable.
 */
$app->post('/api/replay', function (Request $r, Response $s) use ($derive, $repo) {
    $b = (array)$r->getParsedBody();
    $view = (string)($b['view'] ?? 'agent-state');
    try {
        $derive->assertCompatible(isset($b['derivationVersion']) ? (string)$b['derivationVersion'] : null,
                                  isset($b['schemaVersion']) ? (string)$b['schemaVersion'] : null);
    } catch (VersionException $e) {
        return Http::json($s->withStatus(409), ['error' => $e->getMessage(), 'derivationVersion' => $derive->derivationVersion()]);
    }
    $input = $b['input'] ?? null;
    if (!is_array($input)) {
        return Http::json($s->withStatus(422), ['error' => 'replay requires an input object']);
    }
    $output = match ($view) {
        'team'        => $derive->deriveTeam($input),
        'agent-state' => $derive->deriveAgentState($input),
        default       => null,
    };
    if ($output === null) {
        return Http::json($s->withStatus(422), ['error' => "unknown replay view: {$view}"]);
    }
    $hash = $derive->inputHash($input);
    $stored = $repo->getDerivation($view, $hash, $derive->derivationVersion());
    $reproduced = $stored === null ? null : (Derivation::canonicalize($stored['output']) === Derivation::canonicalize($output));
    return Http::json($s, [
        'view' => $view, 'source' => 'server', 'inputHash' => $hash,
        'derivationVersion' => $derive->derivationVersion(), 'schemaVersion' => $derive->schemaVersion(),
        'reproduced' => $reproduced, 'output' => $output,
    ]);
});

// ===== Phase 8: Constitutional Observability ==============================================
// Governance visibility is DERIVED and READ-ONLY (never mutates state). The Technical Audit Log is
// append-only and independently verifiable. Neither becomes constitutional authority.

/** Governance visibility — derived, read-only governance status + constitutional health. */
$app->get('/api/derived/governance', function (Request $r, Response $s) use ($derive, $loadCollections) {
    $collections = $loadCollections();
    return Http::json($s, [
        'view' => 'governance', 'source' => 'server', 'readOnly' => true,
        'derivationVersion' => $derive->derivationVersion(), 'schemaVersion' => $derive->schemaVersion(),
        'governance' => $derive->deriveGovernance($collections),
    ]);
});

/** Technical Audit Log — append-only event stream (read-only). */
$app->get('/api/audit', fn(Request $r, Response $s) =>
    Http::json($s, ['source' => 'server', 'count' => $audit->count(), 'events' => $audit->list(500)]));

/** Independent audit-integrity verification (recomputes the hash-chain). */
$app->get('/api/audit/verify', fn(Request $r, Response $s) =>
    Http::json($s, ['source' => 'server'] + $audit->verifyIntegrity()));

// ===== Phase 9: Constitutional Operational Awareness =======================================
// Operational awareness is DERIVED and READ-ONLY. Notifications/workflows/queues/escalation never
// create constitutional authority and never modify constitutional state. Notification History is a
// third stream, distinct from the Technical Audit Log and Operational History.

/** Operational awareness — derived, read-only. Optional `asOf` (explicit time; never wall clock). */
$app->get('/api/derived/operations', function (Request $r, Response $s) use ($ops, $loadCollections) {
    $asOf = $r->getQueryParams()['asOf'] ?? null;
    return Http::json($s, ['view' => 'operations'] + $ops->derive($loadCollections(), is_string($asOf) ? $asOf : null));
});

/**
 * Generate (surface) notifications: derive from constitutional state and APPEND newly-surfaced ones
 * to Notification History (de-duplicated). This records what was surfaced; it changes NO governed
 * record and grants NO authority. Returns the derived notifications + how many were newly recorded.
 */
$app->post('/api/notifications/generate', function (Request $r, Response $s) use ($ops, $notify, $loadCollections, $reqId) {
    $b = (array)$r->getParsedBody();
    $asOf = is_string($b['asOf'] ?? null) ? $b['asOf'] : null;
    $model = $ops->derive($loadCollections(), $asOf);
    $recorded = 0;
    foreach ($model['notifications'] as $n) {
        if ($notify->record($n, $reqId($r))) $recorded++;
    }
    return Http::json($s, ['source' => 'server', 'derived' => count($model['notifications']), 'newlyRecorded' => $recorded, 'notifications' => $model['notifications']]);
});

/** Notification History — append-only operational stream (read-only). */
$app->get('/api/notifications', fn(Request $r, Response $s) =>
    Http::json($s, ['source' => 'server', 'count' => $notify->count(), 'notifications' => $notify->list(500)]));

/** Generic derivation seam (fallback). Specific views are registered above (static-before-variable). */
$app->get('/api/derived/{view}', fn(Request $r, Response $s, array $a) =>
    Http::json($s, ['view' => $a['view'], 'derivationVersion' => $derive->derivationVersion(), 'schemaVersion' => $derive->schemaVersion(), 'source' => 'server', 'note' => 'no canonical derivation registered for this view']));

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
