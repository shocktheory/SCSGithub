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
        public readonly string $sslCa = '',
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
            // Phase 10: managed-database TLS CA path (e.g. DigitalOcean Managed MySQL). Empty = no
            // explicit CA (dev/test). Never a secret value — a filesystem path to a CA cert.
            sslCa: $get('DB_SSL_CA', ''),
        );
    }

    public function isProduction(): bool
    {
        return $this->env === 'production';
    }

    /**
     * Phase 10 production readiness — a PURE, fail-closed check (no I/O). Returns the list of
     * unmet production requirements; an empty list means ready. Only meaningful in production;
     * dev/test are always considered ready. Never returns secret values — only requirement names.
     */
    public function productionReadiness(): array
    {
        if (!$this->isProduction()) {
            return [];
        }
        $missing = [];
        if ($this->dbPassword === '') {
            $missing[] = 'DB_PASSWORD (must be set from the managed-database secret)';
        }
        if ($this->dbUser === '' || $this->dbUser === 'scs_dev') {
            $missing[] = 'DB_USER (still the development default)';
        }
        if (str_contains($this->dsn, 'scs_dev') || str_contains($this->dsn, '127.0.0.1') || str_contains($this->dsn, 'localhost')) {
            $missing[] = 'DB_DSN (still points at the development database)';
        }
        return $missing;
    }

    public function isProductionReady(): bool
    {
        return $this->productionReadiness() === [];
    }
}
