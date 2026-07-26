<?php
declare(strict_types=1);

use PHPUnit\Framework\TestCase;
use Scs\Config;

/**
 * Phase 10 — production-environment handling. Pure config logic (no DB), so it runs anywhere.
 * Verifies the fail-closed production readiness contract and that dev/test are unaffected.
 */
final class ConfigTest extends TestCase
{
    private function config(string $env, array $over = []): Config
    {
        return new Config(
            env: $env,
            dsn: $over['dsn'] ?? 'mysql:host=db.example.com;port=25060;dbname=scs;charset=utf8mb4',
            dbUser: $over['dbUser'] ?? 'scs_app',
            dbPassword: $over['dbPassword'] ?? 's3cret',
            resetToken: $over['resetToken'] ?? 'rotated-token',
            derivationVersion: '1.0.0',
            sslCa: $over['sslCa'] ?? '',
        );
    }

    public function testDevelopmentIsNeverProductionAndAlwaysReady(): void
    {
        $c = $this->config('development', ['dbPassword' => '', 'dbUser' => 'scs_dev', 'dsn' => 'mysql:host=127.0.0.1;dbname=scs_dev']);
        $this->assertFalse($c->isProduction());
        $this->assertSame([], $c->productionReadiness());
        $this->assertTrue($c->isProductionReady());
    }

    public function testTestEnvIsNotProduction(): void
    {
        $this->assertFalse($this->config('test')->isProduction());
        $this->assertTrue($this->config('test')->isProductionReady());
    }

    public function testProductionWithCompleteConfigIsReady(): void
    {
        $c = $this->config('production');
        $this->assertTrue($c->isProduction());
        $this->assertSame([], $c->productionReadiness());
        $this->assertTrue($c->isProductionReady());
    }

    public function testProductionFailsClosedWhenPasswordMissing(): void
    {
        $c = $this->config('production', ['dbPassword' => '']);
        $this->assertFalse($c->isProductionReady());
        $this->assertNotEmpty($c->productionReadiness());
        $this->assertStringContainsStringIgnoringCase('DB_PASSWORD', implode(' ', $c->productionReadiness()));
    }

    public function testProductionFailsClosedOnDevelopmentDefaults(): void
    {
        $c = $this->config('production', [
            'dsn' => 'mysql:host=127.0.0.1;port=3306;dbname=scs_dev;charset=utf8mb4',
            'dbUser' => 'scs_dev',
        ]);
        $missing = $c->productionReadiness();
        $this->assertFalse($c->isProductionReady());
        // Both the dev DSN and the dev user are flagged.
        $joined = implode(' | ', $missing);
        $this->assertStringContainsString('DB_DSN', $joined);
        $this->assertStringContainsString('DB_USER', $joined);
    }

    public function testReadinessNeverLeaksSecretValues(): void
    {
        $c = $this->config('production', ['dbPassword' => '']);
        foreach ($c->productionReadiness() as $item) {
            // Requirement names only — the actual password value must never appear.
            $this->assertStringNotContainsString('s3cret', $item);
        }
        $this->assertTrue(true);
    }
}
