<?php
declare(strict_types=1);

namespace Scs\Tests;

use PHPUnit\Framework\TestCase;
use Scs\Config;
use Scs\Database;
use Scs\Repository;
use Scs\Commands;
use Scs\Auth;
use Scs\Authz;
use Scs\Totp;
use Slim\Psr7\Response;

/**
 * Phase 6 — Identity, Authority & Trust runtime tests against REAL MySQL (Condition §8).
 * Includes the mandatory regression tests. Requires migrations 0001+0002 applied (CI runs migrate).
 */
final class AuthTest extends TestCase
{
    private Config $config;
    private Database $db;
    private Auth $auth;
    private Repository $repo;

    protected function setUp(): void
    {
        $this->config = Config::fromEnv();
        try { $this->db = new Database($this->config); $this->db->pdo(); }
        catch (\Throwable $e) { $this->markTestSkipped('no MySQL: ' . $e->getMessage()); }
        $this->auth = new Auth($this->db);
        $this->repo = new Repository($this->db);
        $pdo = $this->db->pdo();
        foreach (['sessions', 'recovery_tokens', 'mutation_attributions', 'auth_events'] as $t) $pdo->exec("DELETE FROM {$t}");
        $pdo->exec('DELETE FROM users');
        $this->repo->resetAll();
    }

    private function po(): array { return ['id' => 'po', 'role' => 'product_owner', 'mfaVerified' => true, 'mfaFresh' => true]; }

    // ---- Identity / authentication ----------------------------------------------------------
    public function testArgon2idLoginWithoutMfa(): void
    {
        $this->auth->createUser('agent@scs.test', 'agent-pw', 'agent');
        $res = $this->auth->login('agent@scs.test', 'agent-pw', null);
        $this->assertNotEmpty($res['sessionId']);
        $actor = $this->auth->resolveActor($res['sessionId']);
        $this->assertSame('agent', $actor['role']);
    }

    public function testProductOwnerRequiresMfa(): void
    {
        $secret = Totp::generateSecret();
        $this->auth->createUser('po@scs.test', 'po-pw', 'product_owner', $secret);
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('mfa_required');
        $this->auth->login('po@scs.test', 'po-pw', null);
    }

    public function testProductOwnerMfaSuccessAndBadCode(): void
    {
        $secret = Totp::generateSecret();
        $this->auth->createUser('po@scs.test', 'po-pw', 'product_owner', $secret);
        $good = Totp::codeAt($secret, time());
        $res = $this->auth->login('po@scs.test', 'po-pw', $good);
        $this->assertTrue($res['mfaVerified']);
        try { $this->auth->login('po@scs.test', 'po-pw', '000000'); $this->fail('bad mfa accepted'); }
        catch (\RuntimeException $e) { $this->assertSame('mfa_invalid', $e->getMessage()); }
    }

    public function testLockoutAfterFailures(): void
    {
        $this->auth->createUser('a@scs.test', 'right', 'agent');
        for ($i = 0; $i < 5; $i++) { try { $this->auth->login('a@scs.test', 'wrong', null); } catch (\RuntimeException) {} }
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('locked');
        $this->auth->login('a@scs.test', 'right', null);
    }

    public function testSessionExpiryAndRevocation(): void
    {
        $this->auth->createUser('a@scs.test', 'pw', 'agent');
        $res = $this->auth->login('a@scs.test', 'pw', null);
        $sid = $res['sessionId'];
        $this->assertNotNull($this->auth->resolveActor($sid));
        $this->db->pdo()->prepare('UPDATE sessions SET expires_at = FROM_UNIXTIME(?) WHERE id = ?')->execute([time() - 10, $sid]);
        $this->assertNull($this->auth->resolveActor($sid), 'expired session must not resolve');
        $res2 = $this->auth->login('a@scs.test', 'pw', null);
        $this->auth->revoke($res2['sessionId']);
        $this->assertNull($this->auth->resolveActor($res2['sessionId']), 'revoked session must not resolve');
    }

    public function testRecoveryTokenSingleUse(): void
    {
        $id = $this->auth->createUser('a@scs.test', 'old', 'agent');
        $token = $this->auth->createRecoveryToken($id);
        $this->assertTrue($this->auth->consumeRecovery($token, 'new'));
        $this->assertNotNull($this->auth->login('a@scs.test', 'new', null));
        $this->assertFalse($this->auth->consumeRecovery($token, 'again'), 'recovery token must be single-use');
    }

    // ---- Authority / approval boundary (MANDATORY regressions) -------------------------------
    public function testProductOwnerCanApprove(): void
    {
        $this->repo->upsert('products', ['id' => 'p1', 'name' => 'A', 'authorityStatus' => 'reported']);
        $cmd = new Commands($this->repo, $this->auth);
        $res = $cmd->handle('approve', ['collection' => 'products', 'id' => 'p1', 'transition' => 'approved'], new Response(), $this->po(), 'req-1');
        $this->assertSame(200, $res->getStatusCode());
        $this->assertSame('approved', $this->repo->get('products', 'p1')['record']['authorityStatus']);
    }

    public function testAgentCannotApprove(): void
    {
        $this->repo->upsert('products', ['id' => 'p1', 'name' => 'A']);
        $cmd = new Commands($this->repo, $this->auth);
        $res = $cmd->handle('approve', ['collection' => 'products', 'id' => 'p1'], new Response(), ['id' => 'a', 'role' => 'agent'], 'r');
        $this->assertSame(403, $res->getStatusCode());
    }

    public function testUnauthenticatedApproveDenied(): void
    {
        $cmd = new Commands($this->repo, $this->auth);
        $res = $cmd->handle('approve', ['collection' => 'products', 'id' => 'p1'], new Response(), null, 'r');
        $this->assertSame(401, $res->getStatusCode());
    }

    public function testAdminCannotSetAuthorityViaUpsert(): void
    {
        $cmd = new Commands($this->repo, $this->auth);
        $res = $cmd->handle('upsert', ['collection' => 'products', 'record' => ['id' => 'p1', 'authorityStatus' => 'approved']], new Response(), ['id' => 'adm', 'role' => 'administrator'], 'r');
        $this->assertSame(403, $res->getStatusCode(), 'admin must not set authority via upsert');
    }

    public function testDirectAuthorityMutationViaUpsertRejected(): void
    {
        $cmd = new Commands($this->repo, $this->auth);
        // Even the Product Owner cannot elevate authority through a plain upsert — must use approve.
        $res = $cmd->handle('upsert', ['collection' => 'products', 'record' => ['id' => 'p1', 'authorityStatus' => 'approved']], new Response(), $this->po(), 'r');
        $this->assertSame(403, $res->getStatusCode());
    }

    public function testAttributionRecorded(): void
    {
        $cmd = new Commands($this->repo, $this->auth);
        $cmd->handle('upsert', ['collection' => 'products', 'record' => ['id' => 'p1', 'name' => 'A']], new Response(), ['id' => 'agent-x', 'role' => 'agent'], 'req-42');
        $row = $this->db->pdo()->query("SELECT actor_id, request_id, action FROM mutation_attributions WHERE record_id = 'p1'")->fetch();
        $this->assertSame('agent-x', $row['actor_id']);
        $this->assertSame('req-42', $row['request_id']);
    }

    public function testAuthzMatrix(): void
    {
        $this->assertTrue(Authz::canApprove($this->po()));
        $this->assertFalse(Authz::canApprove(['role' => 'administrator', 'mfaVerified' => true, 'mfaFresh' => true]));
        $this->assertFalse(Authz::canApprove(['role' => 'product_owner', 'mfaVerified' => false])); // no fresh MFA
        $this->assertTrue(Authz::can(['role' => 'agent'], 'propose'));
        $this->assertFalse(Authz::can(['role' => 'agent'], 'approve'));
        $this->assertFalse(Authz::can(['role' => 'administrator'], 'approve'));
    }
}
