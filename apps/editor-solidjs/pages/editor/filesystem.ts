import FS from "@isomorphic-git/lightning-fs";

/**
 * Prefixes a slash to a path if required.
 *
 * LightningFS has problems with relative paths.
 */
export function normalize(path: string): string {
  let result = path;
  // prefix path with slash
  if (path.at(0) !== "/") {
    result = "/" + path;
  }
  return result;
}

// @ts-ignore
export const filesystem = new FS("fs", { wipe: true });
