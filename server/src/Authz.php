<?php
declare(strict_types=1);

namespace Scs;

/**
 * Authorization (Phase 6). Roles → permissions, least privilege, and the server-side approval
 * boundary. Constitutional rule (Authentication & Authority Principles): authority (approve/accept/
 * activate / setting authorityStatus=approved) originates ONLY from an authenticated Product Owner
 * command with fresh MFA — never from AI agents, administrators, clients, APIs, or automation.
 */
final class Authz
{
    // action → set of roles permitted. 'approve' is intentionally Product-Owner-only.
    private const MATRIX = [
        'read'    => ['product_owner', 'administrator', 'agent', 'service', 'anon'],
        'propose' => ['product_owner', 'agent', 'anon'], // anon = dev/test only (production is refused)
        'admin'   => ['product_owner', 'administrator'],
        'approve' => ['product_owner'],
    ];

    public static function roleOf(?array $actor): string
    {
        return $actor['role'] ?? 'anon';
    }

    public static function can(?array $actor, string $action): bool
    {
        $roles = self::MATRIX[$action] ?? [];
        return in_array(self::roleOf($actor), $roles, true);
    }

    /** The approval boundary: only an authenticated Product Owner with fresh MFA may exercise authority. */
    public static function canApprove(?array $actor): bool
    {
        return self::roleOf($actor) === 'product_owner'
            && !empty($actor['mfaVerified'])
            && !empty($actor['mfaFresh']);
    }

    /** Governed-authority values that a plain upsert may never set (they require an approval command). */
    public static function isElevatedAuthority(?string $authorityStatus): bool
    {
        return in_array($authorityStatus, ['approved', 'accepted', 'activated'], true);
    }
}
