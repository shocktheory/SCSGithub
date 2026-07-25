<?php
declare(strict_types=1);

namespace Scs;

use PDO;
use RuntimeException;

/**
 * Identity & authentication (Phase 6). Native SCS identity only — email/password with Argon2id,
 * DB-backed server-managed sessions, TOTP MFA (mandatory for Product Owner), rotation, revocation,
 * expiry, logout, recovery, and failed-login lockout. No external IdP, no JWT.
 */
final class Auth
{
    private const IDLE_SECONDS     = 1800;    // 30 min idle
    private const ABSOLUTE_SECONDS = 43200;   // 12 h absolute
    private const MFA_FRESH_SECONDS = 900;    // 15 min fresh-MFA window for sensitive actions
    private const LOCK_THRESHOLD   = 5;
    private const LOCK_SECONDS     = 900;

    /** Roles for which MFA is mandatory at login. */
    private const MFA_REQUIRED_ROLES = ['product_owner'];

    public function __construct(private readonly Database $db) {}

    private function id(int $bytes = 16): string { return bin2hex(random_bytes($bytes)); }

    public function createUser(string $email, string $password, string $role, ?string $mfaSecret = null): string
    {
        $id = 'user-' . $this->id(8);
        $hash = password_hash($password, PASSWORD_ARGON2ID);
        $stmt = $this->db->pdo()->prepare(
            'INSERT INTO users (id, email, password_hash, role, mfa_secret) VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->execute([$id, strtolower($email), $hash, $role, $mfaSecret]);
        return $id;
    }

    /** @return array{id:string,email:string,role:string,mfa_secret:?string,status:string,failed_logins:int,locked_until:?string,password_hash:string}|null */
    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->pdo()->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([strtolower($email)]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Authenticate. Throws RuntimeException with a machine code on failure:
     *   invalid_credentials | locked | mfa_required | mfa_invalid | inactive
     * @return array{sessionId:string,csrfToken:string,user:array{id:string,email:string,role:string},mfaVerified:bool}
     */
    public function login(string $email, string $password, ?string $totp, ?string $requestId = null): array
    {
        $user = $this->findByEmail($email);
        if (!$user || $user['status'] !== 'active') {
            $this->event(null, 'login_failed', $requestId, 'no-user-or-inactive');
            throw new RuntimeException('invalid_credentials');
        }
        if ($user['locked_until'] !== null && strtotime($user['locked_until']) > time()) {
            $this->event($user['id'], 'lockout', $requestId);
            throw new RuntimeException('locked');
        }
        if (!password_verify($password, $user['password_hash'])) {
            $this->registerFailure($user);
            $this->event($user['id'], 'login_failed', $requestId, 'bad-password');
            throw new RuntimeException('invalid_credentials');
        }

        $mfaVerified = false;
        $mfaRequired = in_array($user['role'], self::MFA_REQUIRED_ROLES, true) || $user['mfa_secret'] !== null;
        if ($mfaRequired) {
            if ($totp === null || $totp === '') {
                $this->event($user['id'], 'mfa_required', $requestId);
                throw new RuntimeException('mfa_required');
            }
            if ($user['mfa_secret'] === null || !Totp::verify($user['mfa_secret'], $totp)) {
                $this->registerFailure($user);
                $this->event($user['id'], 'login_failed', $requestId, 'bad-mfa');
                throw new RuntimeException('mfa_invalid');
            }
            $mfaVerified = true;
        }

        // Success — reset failures, create a fresh session.
        $this->db->pdo()->prepare('UPDATE users SET failed_logins = 0, locked_until = NULL WHERE id = ?')->execute([$user['id']]);
        $sessionId = 'sess-' . $this->id(24);
        $csrf = $this->id(24);
        $now = time();
        $this->db->pdo()->prepare(
            'INSERT INTO sessions (id, user_id, csrf_token, mfa_verified, mfa_verified_at, created_at, last_seen_at, expires_at)
             VALUES (?, ?, ?, ?, ?, NOW(6), NOW(6), FROM_UNIXTIME(?))'
        )->execute([$sessionId, $user['id'], $csrf, $mfaVerified ? 1 : 0, $mfaVerified ? date('Y-m-d H:i:s', $now) : null, $now + self::ABSOLUTE_SECONDS]);
        $this->event($user['id'], 'login', $requestId);

        return ['sessionId' => $sessionId, 'csrfToken' => $csrf, 'user' => ['id' => $user['id'], 'email' => $user['email'], 'role' => $user['role']], 'mfaVerified' => $mfaVerified];
    }

    private function registerFailure(array $user): void
    {
        $failed = (int) $user['failed_logins'] + 1;
        if ($failed >= self::LOCK_THRESHOLD) {
            $this->db->pdo()->prepare('UPDATE users SET failed_logins = ?, locked_until = FROM_UNIXTIME(?) WHERE id = ?')
                ->execute([$failed, time() + self::LOCK_SECONDS, $user['id']]);
        } else {
            $this->db->pdo()->prepare('UPDATE users SET failed_logins = ? WHERE id = ?')->execute([$failed, $user['id']]);
        }
    }

    /**
     * Resolve the actor for a session id, enforcing revocation, absolute expiry, and idle timeout.
     * @return array{id:string,email:string,role:string,sessionId:string,csrf:string,mfaVerified:bool,mfaFresh:bool}|null
     */
    public function resolveActor(?string $sessionId): ?array
    {
        if (!$sessionId) return null;
        $stmt = $this->db->pdo()->prepare(
            'SELECT s.*, u.email, u.role FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?'
        );
        $stmt->execute([$sessionId]);
        $s = $stmt->fetch();
        if (!$s || (int) $s['revoked'] === 1) return null;
        $now = time();
        if (strtotime($s['expires_at']) <= $now) return null;                         // absolute expiry
        if ($now - strtotime($s['last_seen_at']) > self::IDLE_SECONDS) return null;    // idle timeout
        $this->db->pdo()->prepare('UPDATE sessions SET last_seen_at = NOW(6) WHERE id = ?')->execute([$sessionId]);
        $mfaFresh = $s['mfa_verified_at'] !== null && ($now - strtotime($s['mfa_verified_at'])) <= self::MFA_FRESH_SECONDS;
        return [
            'id' => $s['user_id'], 'email' => $s['email'], 'role' => $s['role'], 'sessionId' => $sessionId,
            'csrf' => $s['csrf_token'], 'mfaVerified' => (int) $s['mfa_verified'] === 1, 'mfaFresh' => $mfaFresh,
        ];
    }

    public function rotate(string $sessionId): ?string
    {
        $actor = $this->resolveActor($sessionId);
        if (!$actor) return null;
        $newId = 'sess-' . $this->id(24);
        $csrf = $this->id(24);
        $now = time();
        $this->db->transaction(function (PDO $pdo) use ($newId, $actor, $csrf, $now, $sessionId) {
            $pdo->prepare('INSERT INTO sessions (id, user_id, csrf_token, mfa_verified, mfa_verified_at, created_at, last_seen_at, expires_at, rotated_from)
                           VALUES (?, ?, ?, ?, NULL, NOW(6), NOW(6), FROM_UNIXTIME(?), ?)')
                ->execute([$newId, $actor['id'], $csrf, $actor['mfaVerified'] ? 1 : 0, $now + self::ABSOLUTE_SECONDS, $sessionId]);
            $pdo->prepare('UPDATE sessions SET revoked = 1 WHERE id = ?')->execute([$sessionId]);
        });
        return $newId;
    }

    public function revoke(string $sessionId): void
    {
        $this->db->pdo()->prepare('UPDATE sessions SET revoked = 1 WHERE id = ?')->execute([$sessionId]);
    }

    public function revokeAll(string $userId): void
    {
        $this->db->pdo()->prepare('UPDATE sessions SET revoked = 1 WHERE user_id = ?')->execute([$userId]);
    }

    public function createRecoveryToken(string $userId): string
    {
        $token = $this->id(24);
        $this->db->pdo()->prepare('INSERT INTO recovery_tokens (token, user_id, expires_at) VALUES (?, ?, FROM_UNIXTIME(?))')
            ->execute([$token, $userId, time() + 3600]);
        return $token;
    }

    /** Consume a single-use, unexpired recovery token and set a new password. */
    public function consumeRecovery(string $token, string $newPassword): bool
    {
        $stmt = $this->db->pdo()->prepare('SELECT * FROM recovery_tokens WHERE token = ?');
        $stmt->execute([$token]);
        $row = $stmt->fetch();
        if (!$row || (int) $row['used'] === 1 || strtotime($row['expires_at']) <= time()) return false;
        return (bool) $this->db->transaction(function (PDO $pdo) use ($row, $newPassword, $token) {
            $pdo->prepare('UPDATE users SET password_hash = ?, failed_logins = 0, locked_until = NULL WHERE id = ?')
                ->execute([password_hash($newPassword, PASSWORD_ARGON2ID), $row['user_id']]);
            $pdo->prepare('UPDATE recovery_tokens SET used = 1 WHERE token = ?')->execute([$token]);
            $pdo->prepare('UPDATE sessions SET revoked = 1 WHERE user_id = ?')->execute([$row['user_id']]); // revoke sessions on recovery
            return true;
        });
    }

    public function event(?string $userId, string $event, ?string $requestId, ?string $detail = null): void
    {
        $this->db->pdo()->prepare('INSERT INTO auth_events (user_id, event, request_id, detail) VALUES (?, ?, ?, ?)')
            ->execute([$userId, $event, $requestId, $detail]);
    }
}
