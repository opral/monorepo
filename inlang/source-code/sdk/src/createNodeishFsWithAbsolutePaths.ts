import { normalizePath, type NodeishFilesystem } from "@lix-js/fs";
import { isAbsolutePath } from "./validateProjectPath.js";

/**
 * Wraps the nodeish filesystem subset with a function that intercepts paths
 * and prepends the base path.
 *
 * The paths are resolved from the `projectPath` argument.
 */
export const createNodeishFsWithAbsolutePaths = (args: {
  projectPath: string;
  nodeishFs: NodeishFilesystem;
}): NodeishFilesystem => {
  if (!isAbsolutePath(args.projectPath)) {
    throw new Error(
      `Expected an absolute path but received "${args.projectPath}".`,
    );
  }

  // get the base path of the settings file by
  // removing the file name from the path
  const basePath = normalizePath(args.projectPath)
    .split("/")
    .slice(0, -1)
    .join("/");

  const makeAbsolute = (path: string) => {
    if (isAbsolutePath(path)) {
      return normalizePath(path);
    }

    return normalizePath(basePath + "/" + path);
  };

  return {
    // @ts-expect-error
    readFile: (path: string, options: { encoding: "utf-8" | "binary" }) =>
      args.nodeishFs.readFile(makeAbsolute(path), options),
    readdir: (path: string) => args.nodeishFs.readdir(makeAbsolute(path)),
    mkdir: (path: string, options: { recursive: boolean }) =>
      args.nodeishFs.mkdir(makeAbsolute(path), options),
    writeFile: (path: string, data: string) =>
      args.nodeishFs.writeFile(makeAbsolute(path), data),
    stat: (path: string) => args.nodeishFs.stat(makeAbsolute(path)),
    rm: (path: string) => args.nodeishFs.rm(makeAbsolute(path)),
    rmdir: (path: string) => (args.nodeishFs as any).rmdir(makeAbsolute(path)),
    watch: (
      path: string,
      options: {
        signal: AbortSignal | undefined;
        recursive: boolean | undefined;
      },
    ) => args.nodeishFs.watch(makeAbsolute(path), options),
    // This might be surprising when symlinks were intended to be relative
    symlink: (target: string, path: string) =>
      args.nodeishFs.symlink(makeAbsolute(target), makeAbsolute(path)),
    unlink: (path: string) => args.nodeishFs.unlink(makeAbsolute(path)),
    readlink: (path: string) => args.nodeishFs.readlink(makeAbsolute(path)),
    lstat: (path: string) => args.nodeishFs.lstat(makeAbsolute(path)),
  };
};
