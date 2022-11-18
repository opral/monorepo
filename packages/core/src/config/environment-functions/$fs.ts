import type { fs } from "memfs";

/**
 * $fs is fs/promises from memfs.
 *
 * Promised based file system is required to not block the main thread.
 */
export type $fs = typeof fs.promises;
