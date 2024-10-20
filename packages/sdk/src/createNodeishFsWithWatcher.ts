import type { NodeishFilesystem } from "@lix-js/fs";

/**
 * Wraps the nodeish filesystem subset with a function that intercepts paths
 * and prepends the base path.
 *
 * The paths are resolved from the `projectPath` argument.
 */
export const createNodeishFsWithWatcher = (args: {
  nodeishFs: NodeishFilesystem;
  onChange: () => void;
}): NodeishFilesystem & {
  stopWatching: () => void;
} => {
  const pathList = new Set<string>();
  const abortControllers = new Set<AbortController>();

  const stopWatching = () => {
    for (const ac of abortControllers) {
      ac.abort();
      abortControllers.delete(ac); // release reference
    }
  };

  const makeWatcher = async (path: string) => {
    try {
      const ac = new AbortController();
      abortControllers.add(ac);
      const watcher = args.nodeishFs.watch(path, {
        signal: ac.signal,
        recursive: true,
        persistent: false,
      });
      if (watcher) {
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        for await (const event of watcher) {
          // whenever the watcher changes we need to update the messages
          args.onChange();
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") return;
      // https://github.com/opral/monorepo/issues/1647
      // the file does not exist (yet)
      // this is not testable beacause the fs.watch api differs
      // from node and lix. lenghty
      else if (err.code === "ENOENT") return;
      throw err;
    }
  };

  /**
   * Creates watchers on-the-fly for any file or directory that is not yet watched.
   *
   * We do this instead of recursively watching the entire project because fs.watch does not support
   * recursive watching on linux in node 18. Once node 18 support is dropped this can be drastically simplified.
   */
  const watched = <T extends any[], R>(
    fn: (path: string, ...rest: T) => R,
  ): ((path: string, ...rest: T) => R) => {
    return (path: string, ...rest: T): R => {
      if (!pathList.has(path)) {
        makeWatcher(path);
        pathList.add(path);
      }
      return fn(path, ...rest);
    };
  };

  return {
    ...args.nodeishFs,
    /**
     * Reads the file and automatically adds it to the list of watched files.
     * Any changes to the file will trigger a message update.
     */
    // @ts-expect-error
    readFile: watched(args.nodeishFs.readFile),
    /**
     * Reads the directory and automatically adds it to the list of watched files.
     * Any changes to the directory will trigger a message update.
     */
    readdir: watched(args.nodeishFs.readdir),
    stopWatching,
  };
};
