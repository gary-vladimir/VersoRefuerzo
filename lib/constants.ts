// Shared numeric constants. Kept tiny — only values used by both server and
// client code that would otherwise drift.

// Window for undoing a verse / collection soft-delete (specs.md §17.5).
// Past this point the next GET-list sweep hard-deletes the row.
export const UNDO_WINDOW_MS = 5_000;
