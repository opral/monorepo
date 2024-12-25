import path from "node:path";
import { pathExists } from "../file-handling/exists.js";

/**
 * Attempts to find the package.json file that's closest to the current working directory.
 *
 * @param fs The filesystem to use.
 * @param cwd The current working directory.
 * @returns The path to the package.json file, or undefined if none was found.
 */
export async function findPackageJson(
	fs: typeof import("node:fs/promises"),
	cwd: string
): Promise<string | undefined> {
	const potentialPackageJsonPath = path.resolve(cwd, "package.json");
	const packageJsonExists = await pathExists(potentialPackageJsonPath, fs);
	if (packageJsonExists) return potentialPackageJsonPath;
	return undefined;
}

export async function getPackageJson(
	fs: typeof import("node:fs/promises"),
	cwd: string
): Promise<unknown | undefined> {
	const packageJsonPath = await findPackageJson(fs, cwd);
	if (!packageJsonPath) return undefined;
	try {
		const packageJsonContents = await fs.readFile(packageJsonPath, {
			encoding: "utf-8",
		});
		return JSON.parse(packageJsonContents);
	} catch {
		return undefined;
	}
}
