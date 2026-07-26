<?php
declare(strict_types=1);

namespace Scs;

/** Raised when a governed command is not permitted from the record's current state (Phase 7). */
final class TransitionException extends \RuntimeException {}
