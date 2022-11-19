import { fs as memfs } from "memfs";

/**
 * Filesystem that works in the browser and node.
 *
 * Right now, this is a wrapper around memfs/promises.
 * Promises are required in the browser to not block
 * the main thread. In the future, this will likely
 * be replaced with a custom implementation that
 * requires no polyfills.
 */
export const fs = memfs.promises;
