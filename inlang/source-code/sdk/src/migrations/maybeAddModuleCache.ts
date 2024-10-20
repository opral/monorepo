import type { Repository } from "@lix-js/client";
import type { NodeishFilesystem } from "@lix-js/fs";

const EXPECTED_IGNORES = ["cache"];

export async function maybeAddModuleCache(args: {
  projectPath: string;
  repo?: Repository;
}): Promise<void> {
  if (args.repo === undefined) return;

  const projectExists = await directoryExists(
    args.projectPath,
    args.repo.nodeishFs,
  );
  if (!projectExists) return;

  const gitignorePath = args.projectPath + "/.gitignore";
  const moduleCache = args.projectPath + "/cache/modules/";

  const gitignoreExists = await fileExists(gitignorePath, args.repo.nodeishFs);
  const moduleCacheExists = await directoryExists(
    moduleCache,
    args.repo.nodeishFs,
  );

  if (gitignoreExists) {
    // non-destructively add any missing ignores
    try {
      const gitignore = await args.repo.nodeishFs.readFile(gitignorePath, {
        encoding: "utf-8",
      });
      const missingIgnores = EXPECTED_IGNORES.filter(
        (ignore) => !gitignore.includes(ignore),
      );
      if (missingIgnores.length > 0) {
        await args.repo.nodeishFs.appendFile(
          gitignorePath,
          "\n" + missingIgnores.join("\n"),
        );
      }
    } catch (error) {
      throw new Error("[migrate:module-cache] Failed to update .gitignore", {
        cause: error,
      });
    }
  } else {
    try {
      await args.repo.nodeishFs.writeFile(
        gitignorePath,
        EXPECTED_IGNORES.join("\n"),
      );
    } catch (e) {
      // @ts-ignore
      if (e.code && e.code !== "EISDIR" && e.code !== "EEXIST") {
        throw new Error("[migrate:module-cache] Failed to create .gitignore", {
          cause: e,
        });
      }
    }
  }

  if (!moduleCacheExists) {
    try {
      await args.repo.nodeishFs.mkdir(moduleCache, { recursive: true });
    } catch (e) {
      throw new Error(
        "[migrate:module-cache] Failed to create cache directory",
        { cause: e },
      );
    }
  }
}

async function fileExists(
  path: string,
  nodeishFs: NodeishFilesystem,
): Promise<boolean> {
  try {
    const stat = await nodeishFs.stat(path);
    return stat.isFile();
  } catch {
    return false;
  }
}

async function directoryExists(
  path: string,
  nodeishFs: NodeishFilesystem,
): Promise<boolean> {
  try {
    const stat = await nodeishFs.stat(path);
    return stat.isDirectory();
  } catch {
    return false;
  }
}
