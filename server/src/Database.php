<?php
declare(strict_types=1);

namespace Scs;

use PDO;

/** PDO factory. Parameterized access only — repositories never interpolate SQL. */
final class Database
{
    private ?PDO $pdo = null;

    public function __construct(private readonly Config $config) {}

    public function pdo(): PDO
    {
        if ($this->pdo === null) {
            $this->pdo = new PDO($this->config->dsn, $this->config->dbUser, $this->config->dbPassword, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        }
        return $this->pdo;
    }

    /** Run a callback inside a transaction; rolls back on any exception. */
    public function transaction(callable $fn): mixed
    {
        $pdo = $this->pdo();
        $pdo->beginTransaction();
        try {
            $result = $fn($pdo);
            $pdo->commit();
            return $result;
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }
}
