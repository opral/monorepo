import type { ProjectSettings } from "@inlang/sdk";
import fs from "node:fs";
import path from "node:path";

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const tsRuntime = fs.readFileSync(path.resolve(__dirname, "ts-runtime.ts"), {
	encoding: "utf-8",
});
const jsdocRuntime = fs.readFileSync(
	path.resolve(__dirname, "jsdoc-runtime.js"),
	{
		encoding: "utf-8",
	}
);

/**
 * Returns the code for the `runtime.js` module
 */
export function createRuntime(
	settings: Pick<ProjectSettings, "baseLocale" | "locales">,
	emitTs: boolean
): string {
	const runtimeCode = emitTs ? tsRuntime : jsdocRuntime;

	return (
		runtimeCode
			// replace the locales first
			.replace('["<replace>"]', JSON.stringify(settings.locales))
			// then the base locale
			.replace('"<replace>"', JSON.stringify(settings.baseLocale))
	);
}
