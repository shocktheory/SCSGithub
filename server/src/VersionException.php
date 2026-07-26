<?php
declare(strict_types=1);

namespace Scs;

/** Raised when a derivation_version or schema_version is incompatible (Phase 7). */
final class VersionException extends \RuntimeException {}
