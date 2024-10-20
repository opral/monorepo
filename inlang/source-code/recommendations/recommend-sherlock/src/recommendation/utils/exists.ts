import type { NodeishFilesystem } from "@lix-js/fs";

/**
 * Returns true if the path exists (file or directory), false otherwise.
 *
 * @param nodeishFs
 * @returns
 */
export async function pathExists(
  filePath: string,
  nodeishFs: NodeishFilesystem,
) {
  try {
    await nodeishFs.stat(filePath);
    return true;
  } catch (error) {
    return false;
  }
}
