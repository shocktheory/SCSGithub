<?php
declare(strict_types=1);

namespace Scs\Tests;

use PHPUnit\Framework\TestCase;
use Scs\Config;
use Scs\Database;
use Scs\Repository;
use Scs\Commands;
use Scs\Importer;
use Slim\Psr7\Response;

/**
 * Governed persistence runtime tests against REAL MySQL (Condition §6/§7/§9).
 * Requires migrations already applied (CI runs `php migrations/migrate.php` first).
 * Skipped automatically if no database connection is available.
 */
final class PersistenceTest extends TestCase
{
    private Config $config;
    private Database $db;
    private Repository $repo;

    protected function setUp(): void
    {
        $this->config = Config::fromEnv();
        try {
            $this->db = new Database($this->config);
            $this->db->pdo(); // force connect
        } catch (\Throwable $e) {
            $this->markTestSkipped('no MySQL connection: ' . $e->getMessage());
        }
        $this->repo = new Repository($this->db);
        $this->repo->resetAll();
    }

    public function testMigrationsCreatedAllTables(): void
    {
        $rows = $this->db->pdo()->query('SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()')->fetchAll(\PDO::FETCH_COLUMN);
        $this->assertContains('schema_migrations', $rows);
        foreach (['products', 'ai_collaborators', 'standing_directives', 'assignment_directives', 'deliverables', 'gates', 'teams', 'team_memberships', 'operational_history', 'decisions'] as $t) {
            $this->assertContains($t, $rows, "missing table {$t}");
        }
    }

    public function testUpsertListGetUpdate(): void
    {
        $this->assertSame([], $this->repo->list('products'));
        $v1 = $this->repo->upsert('products', ['id' => 'p1', 'name' => 'Alpha']);
        $this->assertSame(1, $v1);
        $this->assertSame('Alpha', $this->repo->get('products', 'p1')['record']['name']);
        $v2 = $this->repo->upsert('products', ['id' => 'p1', 'name' => 'Alpha-2']);
        $this->assertSame(2, $v2);
        $this->assertSame('Alpha-2', $this->repo->get('products', 'p1')['record']['name']);
        $this->assertCount(1, $this->repo->list('products'));
    }

    public function testOptimisticConcurrencyConflict(): void
    {
        $cmd = new Commands($this->repo);
        $r1 = $cmd->handle('upsert', ['collection' => 'products', 'record' => ['id' => 'p1', 'name' => 'v1']], new Response());
        $this->assertSame(200, $r1->getStatusCode());
        $r2 = $cmd->handle('upsert', ['collection' => 'products', 'record' => ['id' => 'p1', 'name' => 'v2'], 'expectedVersion' => 1], new Response());
        $this->assertSame(200, $r2->getStatusCode()); // version now 2
        // Stale write with expectedVersion=1 must be rejected.
        $r3 = $cmd->handle('upsert', ['collection' => 'products', 'record' => ['id' => 'p1', 'name' => 'STALE'], 'expectedVersion' => 1], new Response());
        $this->assertSame(409, $r3->getStatusCode());
        $this->assertSame('v2', $this->repo->get('products', 'p1')['record']['name']);
    }

    public function testIdempotency(): void
    {
        $cmd = new Commands($this->repo);
        $body = ['collection' => 'products', 'record' => ['id' => 'p1', 'name' => 'A'], 'idempotencyKey' => 'K1'];
        $cmd->handle('upsert', $body, new Response());
        $cmd->handle('upsert', $body, new Response()); // same key → not re-applied
        $this->assertSame(1, $this->repo->get('products', 'p1')['version']);
    }

    public function testForeignKeyConstraintRejectsBadReference(): void
    {
        // standing_directives.agent → ai_collaborators(id). A missing agent must be rejected by the DB.
        $this->expectException(\PDOException::class);
        $this->repo->upsert('standingDirectives', ['id' => 'sd-bad', 'agent' => 'ghost-agent', 'directiveId' => 'X']);
    }

    public function testTransactionRollback(): void
    {
        try {
            $this->db->transaction(function () {
                $this->repo->upsert('products', ['id' => 'tx1', 'name' => 'in-tx']);
                throw new \RuntimeException('force rollback');
            });
        } catch (\RuntimeException) {
            // expected
        }
        $this->assertNull($this->repo->get('products', 'tx1'), 'rolled-back row must not persist');
    }

    public function testImportDryRunAndApply(): void
    {
        $importer = new Importer($this->repo, $this->config);
        $backup = ['schemaVersion' => Repository::SCHEMA_VERSION, 'isSeed' => true, 'collections' => ['products' => [['id' => 'i1', 'name' => 'Imported', 'demonstration' => true]]]];
        $dry = $importer->run(['backup' => $backup, 'dryRun' => true], new Response());
        $this->assertSame(200, $dry->getStatusCode());
        $this->assertNull($this->repo->get('products', 'i1'), 'dry run must not write');
        $apply = $importer->run(['backup' => $backup], new Response());
        $this->assertSame(200, $apply->getStatusCode());
        $this->assertNotNull($this->repo->get('products', 'i1'));
    }

    public function testImportRejectsSchemaMismatch(): void
    {
        $importer = new Importer($this->repo, $this->config);
        $bad = ['schemaVersion' => '9.9.9', 'isSeed' => true, 'collections' => []];
        $res = $importer->run(['backup' => $bad], new Response());
        $this->assertSame(422, $res->getStatusCode());
    }
}
