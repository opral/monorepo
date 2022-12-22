import type { fs } from "memfs";

/**
 * Reflects the `node:fs/promises` API.
 *
 * Uses [memfs](https://github.com/streamich/memfs) under the hood. A
 * promise based file system is required to not block the main thread.
 */
export type $fs = typeof fs.promises;
