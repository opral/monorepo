import { parse, type CommentJSONValue, stringify } from "comment-json";
import { type ExtensionsJson as ExtensionsJsonType } from "./utils/types.js";
import { pathExists } from "./utils/exists.js";
import { normalize, join } from "node:path";

const vsCodePath = "./.vscode";

export async function addRecommendationToWorkspace(
	fs: typeof import("node:fs/promises"),
	workingDirectory?: string
): Promise<void> {
	const vscodeFolderPath = workingDirectory
		? normalize(join(workingDirectory ?? "", vsCodePath))
		: vsCodePath;
	const extensionsJsonPath = join(vscodeFolderPath, "extensions.json");

	if (!(await pathExists(vscodeFolderPath, fs))) {
		await fs.mkdir(vscodeFolderPath);
	}

	let extensions: ExtensionsJsonType;
	if (await pathExists(extensionsJsonPath, fs)) {
		try {
			const file = await fs.readFile(extensionsJsonPath, { encoding: "utf-8" });
			const parsed = file ? parse(file) : { recommendations: [] };
			extensions = parsed as ExtensionsJsonType;
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
	fs: typeof import("node:fs/promises"),
	workingDirectory?: string
): Promise<boolean> {
	const vscodeFolderPath = workingDirectory
		? normalize(join(workingDirectory ?? "", vsCodePath))
		: vsCodePath;
	const extensionsJsonPath = join(vscodeFolderPath, "extensions.json");

	if (
		!(await pathExists(extensionsJsonPath, fs)) ||
		!(await pathExists(vscodeFolderPath, fs))
	) {
		return false;
	}

	const file = await fs.readFile(extensionsJsonPath, { encoding: "utf-8" });

	const extensions = file
		? (parse(file) as unknown as ExtensionsJsonType)
		: { recommendations: [] };

	return (
		extensions?.recommendations?.includes("inlang.vs-code-extension") || false
	);
}
