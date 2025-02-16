import fs from "node:fs";
import { defaultCompilerOptions, type CompilerOptions } from "../compile.js";
import type { Runtime } from "./type.js";

/**
 * Returns the code for the `runtime.js` module
 */
export function createRuntimeFile(args: {
	baseLocale: string;
	locales: string[];
	compilerOptions: {
		strategy: NonNullable<CompilerOptions["strategy"]>;
		cookieName: NonNullable<CompilerOptions["cookieName"]>;
		pathnameBase?: CompilerOptions["pathnameBase"];
		urlPatterns?: CompilerOptions["urlPatterns"];
	};
	testing?: boolean;
}): string {
	// const pathnames = args.compilerOptions.pathnames ?? {
	// 	"/{*path}": Object.fromEntries([
	// 		...args.locales.map((locale) => [locale, `/${locale}{/*path}`]),
	// 		[args.baseLocale, `/{*path}`],
	// 	]),
	// };

	return `
import "@inlang/paraglide-js/urlpattern-polyfill";

${injectCode("./variables.js")
	.replace(
		`export const baseLocale = "en";`,
		`export const baseLocale = "${args.baseLocale}";`
	)
	.replace(
		`export const locales = /** @type {const} */ (["en", "de"]);`,
		`export const locales = /** @type {const} */ (["${args.locales.join('", "')}"]);`
	)
	.replace(
		`export const strategy = ["globalVariable"];`,
		`export const strategy = ["${args.compilerOptions.strategy.join('", "')}"]`
	)
	.replace(`<cookie-name>`, `${args.compilerOptions.cookieName}`)
	.replace(
		`export const TREE_SHAKE_COOKIE_STRATEGY_USED = false;`,
		`const TREE_SHAKE_COOKIE_STRATEGY_USED = ${args.compilerOptions.strategy.includes("cookie")};`
	)
	.replace(
		`export const TREE_SHAKE_URL_PATTERN_STRATEGY_USED = false;`,
		`const TREE_SHAKE_URL_PATTERN_STRATEGY_USED = ${args.compilerOptions.strategy.includes("urlPattern")};`
	)
	.replace(
		`export const TREE_SHAKE_GLOBAL_VARIABLE_STRATEGY_USED = false;`,
		`const TREE_SHAKE_GLOBAL_VARIABLE_STRATEGY_USED = ${args.compilerOptions.strategy.includes("globalVariable")};`
	)
	.replace(
		`export const urlPatterns = [];`,
		`export const urlPatterns = ${JSON.stringify(args.compilerOptions.urlPatterns, null, 2)};`
	)}

${injectCode("./get-locale.js")} 

${injectCode("./set-locale.js")}

${injectCode("./get-url-origin.js").replace(/** non public api */ "export let getUrlOrigin", args.testing ? "export let getUrlOrigin" : "let getUrlOrigin")}

${injectCode("./is-locale.js")}

${injectCode("./assert-is-locale.js")}

${injectCode("./extract-locale-from-request.js")}

${injectCode("./extract-locale-from-cookie.js")}

${injectCode("./extract-locale-from-url.js")}

${injectCode("./localize-url.js")}

${injectCode("./localize-href.js")}

// ------ TYPES ------

/**
 * A locale that is available in the project.
 *
 * @example
 *   setLocale(request.locale as Locale)
 *
 * @typedef {(typeof locales)[number]} Locale
 */

`;
}

/**
 * Load a file from the current directory.
 *
 * Prunes the imports on top of the file as the runtime is
 * self-contained.
 *
 * @param {string} path
 * @returns {string}
 */
function injectCode(path: string): string {
	const code = fs.readFileSync(new URL(path, import.meta.url), "utf-8");
	// Regex to match single-line and multi-line imports
	const importRegex = /import\s+[\s\S]*?from\s+['"][^'"]+['"]\s*;?/g;
	return code.replace(importRegex, "").trim();
}

/**
 * Returns the runtime module as an object for testing purposes.
 *
 * @example
 *   const runtime = await createRuntime({
 *      baseLocale: "en",
 *      locales: ["en", "de"],
 *   })
 */
export async function createRuntimeForTesting(args: {
	baseLocale: string;
	locales: string[];
	compilerOptions?: Omit<CompilerOptions, "outdir" | "project" | "fs">;
}): Promise<Runtime> {
	const file = createRuntimeFile({
		baseLocale: args.baseLocale,
		locales: args.locales,
		testing: true,
		compilerOptions: {
			...defaultCompilerOptions,
			...args.compilerOptions,
		},
	})
		// remove the polyfill import statement to avoid module resolution logic in testing
		.replace(`import "@inlang/paraglide-js/urlpattern-polyfill";`, "");

	await import("urlpattern-polyfill");

	return await import(
		"data:text/javascript;base64," +
			Buffer.from(file, "utf-8").toString("base64")
	);
}
