import fs from "node:fs";
import type { CompilerOptions } from "../compiler-options.js";

/**
 * Returns the code for the `runtime.js` module
 */
export function createRuntimeFile(args: {
	baseLocale: string;
	locales: string[];
	compilerOptions: {
		strategy: NonNullable<CompilerOptions["strategy"]>;
		cookieName: NonNullable<CompilerOptions["cookieName"]>;
		cookieMaxAge: NonNullable<CompilerOptions["cookieMaxAge"]>;
		cookieDomain: CompilerOptions["cookieDomain"];
		urlPatterns?: CompilerOptions["urlPatterns"];
		experimentalMiddlewareLocaleSplitting: CompilerOptions["experimentalMiddlewareLocaleSplitting"];
		isServer: CompilerOptions["isServer"];
		localStorageKey: CompilerOptions["localStorageKey"];
		disableAsyncLocalStorage: NonNullable<
			CompilerOptions["disableAsyncLocalStorage"]
		>;
	};
}): string {
	const urlPatterns = args.compilerOptions.urlPatterns ?? [];

	let defaultUrlPatternUsed = false;

	// add default urlPatterns for a good out of the box experience
	if (args.compilerOptions.urlPatterns === undefined) {
		defaultUrlPatternUsed = true;
		urlPatterns.push({
			pattern: `:protocol://:domain(.*)::port?/:path(.*)?`,
			localized: [],
		});
		for (const locale of args.locales) {
			if (locale === args.baseLocale) {
				continue;
			}
			urlPatterns[0]?.localized.push([
				locale,
				`:protocol://:domain(.*)::port?/${locale}/:path(.*)?`,
			]);
		}
		urlPatterns[0]?.localized.push([
			args.baseLocale,
			`:protocol://:domain(.*)::port?/:path(.*)?`,
		]);
	}
	const code = `
${defaultUrlPatternUsed ? "/** @type {any} */\nconst URLPattern = {}" : `import "@inlang/paraglide-js/urlpattern-polyfill";`}

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
	.replace(`60 * 60 * 24 * 400`, `${args.compilerOptions.cookieMaxAge}`)
	.replace(`<cookie-domain>`, `${args.compilerOptions.cookieDomain}`)
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
	)
	.replace(
		`export const disableAsyncLocalStorage = false;`,
		`export const disableAsyncLocalStorage = ${args.compilerOptions.disableAsyncLocalStorage};`
	)
	.replace(
		`export const TREE_SHAKE_DEFAULT_URL_PATTERN_USED = false;`,
		`const TREE_SHAKE_DEFAULT_URL_PATTERN_USED = ${defaultUrlPatternUsed};`
	)
	.replace(
		`export const experimentalMiddlewareLocaleSplitting = false;`,
		`export const experimentalMiddlewareLocaleSplitting = ${args.compilerOptions.experimentalMiddlewareLocaleSplitting};`
	)
	.replace(
		`export const isServer = typeof window === "undefined";`,
		`export const isServer = ${args.compilerOptions.isServer};`
	)
	.replace(
		`export const localStorageKey = "PARAGLIDE_LOCALE";`,
		`export const localStorageKey = "${args.compilerOptions.localStorageKey}";`
	)
	.replace(
		`export const TREE_SHAKE_LOCAL_STORAGE_STRATEGY_USED = false;`,
		`const TREE_SHAKE_LOCAL_STORAGE_STRATEGY_USED = ${args.compilerOptions.strategy.includes("localStorage")};`
	)}

globalThis.__paraglide = {}

${injectCode("./get-locale.js")}

${injectCode("./set-locale.js")}

${injectCode("./get-url-origin.js")}

${injectCode("./is-locale.js")}

${injectCode("./assert-is-locale.js")}

${injectCode("./extract-locale-from-request.js")}

${injectCode("./extract-locale-from-request-async.js")}

${injectCode("./extract-locale-from-cookie.js")}

${injectCode("./extract-locale-from-header.js")}

${injectCode("./extract-locale-from-navigator.js")}

${injectCode("./extract-locale-from-url.js")}

${injectCode("./localize-url.js")}

${injectCode("./should-redirect.js")}

${injectCode("./localize-href.js")}

${injectCode("./track-message-call.js")}

${injectCode("./generate-static-localized-urls.js")}

${injectCode("./strategy.js")}

// ------ TYPES ------

/**
 * A locale that is available in the project.
 *
 * @example
 *   setLocale(request.locale as Locale)
 *
 * @typedef {(typeof locales)[number]} Locale
 */

/**
 * A branded type representing a localized string.
 * Message functions return this type to distinguish translated strings from regular strings at compile time.
 *
 * @typedef {string & { readonly __brand: 'LocalizedString' }} LocalizedString
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
