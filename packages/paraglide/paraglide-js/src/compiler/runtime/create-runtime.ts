import fs from "node:fs";
import type { Runtime } from "./type.js";
import {
	defaultCompilerOptions,
	type CompilerOptions,
} from "../compiler-options.js";

/**
 * Returns the code for the `runtime.js` module
 */
export function createRuntimeFile(args: {
	baseLocale: string;
	locales: string[];
	compilerOptions: {
		strategy: NonNullable<CompilerOptions["strategy"]>;
		cookieName: NonNullable<CompilerOptions["cookieName"]>;
		urlPatterns?: CompilerOptions["urlPatterns"];
	};
}): string {
	const urlPatterns = args.compilerOptions.urlPatterns ?? [];

	// add default urlPatterns for a good out of the box experience
	if (args.compilerOptions.urlPatterns === undefined) {
		urlPatterns.push({
			pattern: `:protocol://:domain(.*)::port?/:locale(${args.locales.filter((l) => l !== args.baseLocale).join("|")})?/:path(.*)?`,
			deLocalizedNamedGroups: { locale: null },
			localizedNamedGroups: {
				...Object.fromEntries(
					args.locales.map((locale) => [locale, { locale }])
				),
				en: { locale: null },
			},
		});
	}
	const code = `
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
		`export const strategy = ${JSON.stringify(args.compilerOptions.strategy, null, 2)};`
	)
	.replace(`<cookie-name>`, `${args.compilerOptions.cookieName}`)
	.replace(
		`export const TREE_SHAKE_COOKIE_STRATEGY_USED = false;`,
		`const TREE_SHAKE_COOKIE_STRATEGY_USED = ${args.compilerOptions.strategy.includes("cookie")};`
	)
	.replace(
		`export const TREE_SHAKE_URL_STRATEGY_USED = false;`,
		`const TREE_SHAKE_URL_STRATEGY_USED = ${args.compilerOptions.strategy.includes("url")};`
	)
	.replace(
		`export const TREE_SHAKE_GLOBAL_VARIABLE_STRATEGY_USED = false;`,
		`const TREE_SHAKE_GLOBAL_VARIABLE_STRATEGY_USED = ${args.compilerOptions.strategy.includes("globalVariable")};`
	)
	.replace(
		`export const TREE_SHAKE_PREFERRED_LANGUAGE_STRATEGY_USED = false;`,
		`const TREE_SHAKE_PREFERRED_LANGUAGE_STRATEGY_USED = ${args.compilerOptions.strategy.includes("preferredLanguage")};`
	)
	.replace(
		`export const urlPatterns = [];`,
		`export const urlPatterns = ${JSON.stringify(urlPatterns, null, 2)};`
	)}

${injectCode("./get-locale.js")} 

${injectCode("./set-locale.js")}

${injectCode("./get-url-origin.js")}

${injectCode("./is-locale.js")}

${injectCode("./assert-is-locale.js")}

${injectCode("./extract-locale-from-request.js")}

${injectCode("./extract-locale-from-cookie.js")}

${injectCode("./extract-locale-from-url.js")}

${injectCode("./localize-url.js")}

${injectCode("./localize-href.js")}

${injectCode("./server-middleware.js")}

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

	return code;
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
