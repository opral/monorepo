import { normalizePath, type NodeishFilesystem } from "@lix-js/fs";
import { joinPath } from "./utils/joinPath.js";
import { Value } from "@sinclair/typebox/value";
import { parse, type CommentJSONValue, stringify } from "comment-json";
import {
  type ExtensionsJson as ExtensionsJsonType,
  ExtensionsJson,
} from "./utils/types.js";
import { pathExists } from "./utils/exists.js";

const vsCodePath = "./.vscode";

export async function addRecommendationToWorkspace(
  fs: NodeishFilesystem,
  workingDirectory?: string,
): Promise<void> {
  const vscodeFolderPath = workingDirectory
    ? normalizePath(joinPath(workingDirectory ?? "", vsCodePath))
    : vsCodePath;
  const extensionsJsonPath = joinPath(vscodeFolderPath, "extensions.json");

  if (!(await pathExists(vscodeFolderPath, fs))) {
    await fs.mkdir(vscodeFolderPath);
  }

  let extensions: ExtensionsJsonType;
  if (await pathExists(extensionsJsonPath, fs)) {
    try {
      const parsed = parse(
        await fs.readFile(extensionsJsonPath, { encoding: "utf-8" }),
      );
      if (Value.Check(ExtensionsJson, parsed)) {
        extensions = parsed;
      } else {
        extensions = { recommendations: [] };
      }
    } catch (error) {
      extensions = { recommendations: [] };
    }
  } else {
    extensions = { recommendations: [] };
  }

  if (!extensions.recommendations.includes("inlang.vs-code-extension")) {
    extensions.recommendations.push("inlang.vs-code-extension");
    await fs.writeFile(extensionsJsonPath, stringify(extensions, undefined, 2));
  }
}

export async function isInWorkspaceRecommendation(
  fs: NodeishFilesystem,
  workingDirectory?: string,
): Promise<boolean> {
  const vscodeFolderPath = workingDirectory
    ? normalizePath(joinPath(workingDirectory ?? "", vsCodePath))
    : vsCodePath;
  const extensionsJsonPath = joinPath(vscodeFolderPath, "extensions.json");

  if (
    !(await pathExists(extensionsJsonPath, fs)) ||
    !(await pathExists(vscodeFolderPath, fs))
  ) {
    return false;
  }

  const extensions = parse(
    await fs.readFile(extensionsJsonPath, { encoding: "utf-8" }),
  ) as CommentJSONValue;

  if (!Value.Check(ExtensionsJson, extensions)) {
    return false;
  }

  return (
    extensions?.recommendations.includes("inlang.vs-code-extension") || false
  );
}
