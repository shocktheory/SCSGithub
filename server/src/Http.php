<?php
declare(strict_types=1);

namespace Scs;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Throwable;

/** JSON helpers, collection allow-list, and structured error handling. */
final class Http
{
    /** Governed collections (mirrors the client CollectionName / server tables). Phase 8 adds `evidence`. */
    public const COLLECTIONS = [
        'osSystems','products','publications','publicationPhases','gates','decisions',
        'canonicalStatements','canonicalConcepts','aiCollaborators','assignments','benchmarks',
        'risks','updates','artifacts','reviewItems','nextActions','relationships',
        'standingDirectives','assignmentDirectives','deliverables','operationalHistory',
        'teams','teamMemberships','evidence',
    ];

    public static function json(Response $response, mixed $data, int $status = null): Response
    {
        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
        $r = $response->withHeader('Content-Type', 'application/json');
        return $status ? $r->withStatus($status) : $r;
    }

    public static function assertCollection(string $name): void
    {
        if (!in_array($name, self::COLLECTIONS, true)) {
            throw new \InvalidArgumentException("unknown collection: {$name}");
        }
    }

    public static function errorHandler(): callable
    {
        return static function (Request $request, Throwable $e, bool $displayDetails) : Response {
            $status = match (true) {
                $e instanceof \InvalidArgumentException => 422,
                default => 500,
            };
            $body = ['error' => $e->getMessage()];
            if ($displayDetails) $body['trace'] = $e->getTraceAsString();
            $resp = new \Slim\Psr7\Response();
            $resp->getBody()->write(json_encode($body));
            return $resp->withHeader('Content-Type', 'application/json')->withStatus($status);
        };
    }
}
