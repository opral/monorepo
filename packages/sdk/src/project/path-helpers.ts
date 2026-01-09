import nodePath from "node:path";
import type { NodeFsPromisesSubsetLegacy } from "../plugin/schema.js";

/**
 * Functions from a path like `./local-plugins/mock-plugin.js` need to be able
 * to be called with relative paths, even if their implementation expects absolute ones.
 *
 * This mapping is required for backwards compatibility.
 * Relative paths in the project.inlang/settings.json
 * file are resolved to absolute paths with `*.inlang`
 * being pruned.
 *
 * @example
 *   "/website/project.inlang"
 *   "./local-plugins/mock-plugin.js"
 *   -> "/website/local-plugins/mock-plugin.js"
 *
 */
export function withAbsolutePaths(
	fs: NodeFsPromisesSubsetLegacy,
	projectPath: string
): NodeFsPromisesSubsetLegacy {
	return {
		// @ts-expect-error - node type mismatch
		readFile: (path, options) => {
			return fs.readFile(absolutePathFromProject(projectPath, path), options);
		},
		writeFile: (path, data) => {
			return fs.writeFile(absolutePathFromProject(projectPath, path), data);
		},
		mkdir: (path) => {
			return fs.mkdir(absolutePathFromProject(projectPath, path));
		},
		readdir: (path) => {
			return fs.readdir(absolutePathFromProject(projectPath, path));
		},
	};
}

/**
 * Joins a path from a project path.
 *
 * @example
 *   absolutePathFromProject("/project.inlang", "./local-plugins/mock-plugin.js") -> "/local-plugins/mock-plugin.js"
 *
 *   absolutePathFromProject("/website/project.inlang", "./mock-plugin.js") -> "/website/mock-plugin.js"
 */
export function absolutePathFromProject(
	projectPath: string,
	filePath: string
): string {
	// Normalize paths for consistency across platforms
	const normalizedProjectPath = nodePath
		.normalize(projectPath)
		.replace(/\\/g, "/");
	const normalizedFilePath = nodePath.normalize(filePath).replace(/\\/g, "/");

	// Remove the last part of the project path (file name) to get the project root
	const projectRoot = nodePath.dirname(normalizedProjectPath);

	// If filePath is already absolute, return it directly
	if (nodePath.isAbsolute(normalizedFilePath)) {
		return normalizedFilePath;
	}

	// Compute absolute resolved path
	const resolvedPath = nodePath.resolve(projectRoot, normalizedFilePath);

	// Ensure final path always uses forward slashes
	return resolvedPath.replace(/\\/g, "/");
}
