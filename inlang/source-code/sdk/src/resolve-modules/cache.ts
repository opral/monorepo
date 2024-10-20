import type { NodeishFilesystemSubset } from "@inlang/plugin";
import { type Result, tryCatch } from "@inlang/result";

function escape(url: string) {
  const bytes = new TextEncoder().encode(url);

  // 64-bit FNV1a hash to make the file-names shorter
  // https://en.wikipedia.org/wiki/FNV-1a
  const hash = bytes.reduce(
    (hash, byte) =>
      BigInt.asUintN(64, (hash ^ BigInt(byte)) * 1_099_511_628_211n),
    14_695_981_039_346_656_037n,
  );

  return hash.toString(36);
}

async function readModuleFromCache(
  moduleURI: string,
  projectPath: string,
  readFile: NodeishFilesystemSubset["readFile"],
): Promise<Result<string, Error>> {
  const moduleHash = escape(moduleURI);
  const filePath = projectPath + `/cache/modules/${moduleHash}`;

  return await tryCatch(
    async () => await readFile(filePath, { encoding: "utf-8" }),
  );
}

async function writeModuleToCache(
  moduleURI: string,
  moduleContent: string,
  projectPath: string,
  writeFile: NodeishFilesystemSubset["writeFile"],
  mkdir: NodeishFilesystemSubset["mkdir"],
): Promise<void> {
  const moduleHash = escape(moduleURI);
  const filePath = projectPath + `/cache/modules/${moduleHash}`;

  const writeFileResult = await tryCatch(() =>
    writeFile(filePath, moduleContent),
  );
  if (writeFileResult.error) {
    const dirPath = projectPath + `/cache/modules`;
    const createDirResult = await tryCatch(() =>
      mkdir(dirPath, { recursive: true }),
    );

    // @ts-ignore - If the directory exists we can ignore this error
    if (createDirResult.error && createDirResult.error.code !== "EEXIST")
      throw new Error(
        "[sdk:module-cacke] failed to create cache-directory. Path: " + dirPath,
        {
          cause: createDirResult.error,
        },
      );

    const writeFileResult = await tryCatch(() =>
      writeFile(filePath, moduleContent),
    );
    if (writeFileResult.error)
      throw new Error(
        "[sdk:module-cacke] failed to write cache-file. Path: " + filePath,
        {
          cause: writeFileResult.error,
        },
      );
  }
}

/**
 * Implements a "Network-First" caching strategy.
 */
export function withCache(
  moduleLoader: (uri: string) => Promise<string>,
  projectPath: string,
  nodeishFs: Pick<NodeishFilesystemSubset, "readFile" | "writeFile" | "mkdir">,
): (uri: string) => Promise<string> {
  return async (uri: string) => {
    const cachePromise = readModuleFromCache(
      uri,
      projectPath,
      nodeishFs.readFile,
    );
    const loaderResult = await tryCatch(async () => await moduleLoader(uri));

    if (loaderResult.error) {
      const cacheResult = await cachePromise;
      if (!cacheResult.error) return cacheResult.data;
      else throw loaderResult.error;
    } else {
      const moduleAsText = loaderResult.data;
      try {
        await writeModuleToCache(
          uri,
          moduleAsText,
          projectPath,
          nodeishFs.writeFile,
          nodeishFs.mkdir,
        );
      } catch (error) {
        // TODO trigger a warning
      }
      return moduleAsText;
    }
  };
}
