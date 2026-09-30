// Shared numeric constants. Kept tiny — only values used by both server and
// client code that would otherwise drift.

// How long the Undo toast stays up after a verse / collection delete
// (specs.md §17.5).
export const UNDO_WINDOW_MS = 5_000;

// How long the server keeps a soft-deleted row restorable. Deliberately
// longer than the toast: the delete is stamped when the request lands, the
// toast only appears once the response is back, and the restore request
// needs time to arrive, so an Undo tapped in the toast's last moment must
// still succeed.
export const SOFT_DELETE_RETENTION_MS = UNDO_WINDOW_MS + 10_000;
