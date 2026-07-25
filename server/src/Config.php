<?php
declare(strict_types=1);

namespace Scs;

/** Environment-driven config. Secrets come from env only — never committed. */
final class Config
{
    public function __construct(
        public readonly string $env,
        public readonly string $dsn,
        public readonly string $dbUser,
        public readonly string $dbPassword,
        public readonly string $resetToken,
        public readonly string $derivationVersion,
    ) {}

    public static function fromEnv(): self
    {
        $get = static fn(string $k, string $d = ''): string => (string)($_ENV[$k] ?? getenv($k) ?: $d);
        return new self(
            env: $get('SCS_ENV', 'development'),
            dsn: $get('DB_DSN', 'mysql:host=127.0.0.1;port=3306;dbname=scs_dev;charset=utf8mb4'),
            dbUser: $get('DB_USER', 'scs_dev'),
            dbPassword: $get('DB_PASSWORD', ''),
            resetToken: $get('RESET_TOKEN', 'CONFIRM-RESET'),
            derivationVersion: $get('DERIVATION_VERSION', '0.1.0'),
        );
    }
}
