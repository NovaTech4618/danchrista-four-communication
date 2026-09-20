-- pgtap is a test-only extension and must not be exposed by the application database.
-- The repository's pgtap harness installs/uses pgtap in a dedicated database test session.
-- Removing it from this application database eliminates its public API surface.
drop extension if exists pgtap;
