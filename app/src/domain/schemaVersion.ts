/**
 * Data schema version. Stamped into every export and backup so imports can be
 * validated and migrated safely (see DATA_MODEL.md §"Persistence & migration").
 * Bump on any breaking change to entity shape.
 */
export const SCHEMA_VERSION = '0.1.0' as const;
