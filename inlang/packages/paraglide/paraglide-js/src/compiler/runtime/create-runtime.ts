import fs from "node:fs";
import { defaultCompilerOptions, type CompilerOptions } from "../compile.js";

/**
 * Returns the code for the `runtime.js` module
 */
export function createRuntimeFile(args: {
	baseLocale: string;
	locales: string[];
	compilerOptions: {
		strategy: NonNullable<CompilerOptions["strategy"]>;
		cookieName: NonNullable<CompilerOptions["cookieName"]>;
		isServer: string;
	};
}): string {
	return `

${injectCode("./base-locale.js").replace(`<base-locale>`, `${args.baseLocale}`)}

${injectCode("./locales.js").replace(`["<base-locale>"]`, `["${args.locales.join('", "')}"]`)}

${injectCode("./strategy.js").replace(`["variable"]`, `["${args.compilerOptions.strategy.join('", "')}"]`)}

${injectCode("./cookie-name.js").replace(`<cookie-name>`, `${args.compilerOptions.cookieName}`)}

const isServer = ${args.compilerOptions.isServer}

/**
 * Define the \`getLocale()\` function.
 *
 * Use this function to define how the locale is resolved. For example,
 * you can resolve the locale from the browser's preferred language,
 * a cookie, env variable, or a user's preference.
 *
 * @example
 *   defineGetLocale(() => {
 *     // resolve the locale from a cookie. fallback to the base locale.
 *     return Cookies.get('locale') ?? baseLocale
 *   }
 *
 * @param {() => Locale} fn
 * @type {(fn: () => Locale) => void}
 */
export const defineGetLocale = (fn) => {
	getLocale = fn;
};

/**
 * Define the \`setLocale()\` function.
 *
 * Use this function to define how the locale is set. For example,
 * modify a cookie, env variable, or a user's preference.
 *
 * @example
 *   defineSetLocale((newLocale) => {
 *     // set the locale in a cookie
 *     return Cookies.set('locale', newLocale)
 *   });
 *
 * @param {(newLocale: Locale) => void} fn
 */
export const defineSetLocale = (fn) => {
	setLocale = fn;
};

${injectCode("./get-locale.js")} 

${injectCode("./set-locale.js")}

${injectCode("./is-locale.js")}

${injectCode("./assert-is-locale.js")}

${injectCode("./locale-in-path.js")}

${injectCode("./localize-path.js")}

${injectCode("./de-localize-path.js")}

${injectCode("./detect-locale-from-request.js")}

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
	return code.replace(/import\s+.*?;?\n/g, "");
}

/**
 * Returns the runtime module as an object for testing purposes.
 *
 * Defaults to `isServer: "true"` and `strategy: ["variable"]`
 * to avoid server-side testing issues.
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
	compilerOptions?: {
		strategy?: CompilerOptions["strategy"];
		cookieName?: CompilerOptions["cookieName"];
		isServer?: string;
	};
}): Promise<Runtime> {
	const file = createRuntimeFile({
		baseLocale: args.baseLocale,
		locales: args.locales,
		compilerOptions: {
			...defaultCompilerOptions,
			strategy: ["variable"],
			isServer: "true",
			...args.compilerOptions,
		},
	});
	return await import(
		"data:text/javascript;base64," +
			Buffer.from(file, "utf-8").toString("base64")
	);
}

/**
 * The Paraglide runtime API.
 */
export type Runtime = {
	baseLocale: Locale;
	locales: Readonly<Locale[]>;
	strategy: NonNullable<CompilerOptions["strategy"]>;
	cookieName: string;
	getLocale: () => string;
	setLocale: (newLocale: Locale) => void;
	defineGetLocale: (fn: () => Locale) => void;
	defineSetLocale: (fn: (newLocale: Locale) => void) => void;
	assertIsLocale: typeof import("./assert-is-locale.js").assertIsLocale;
	isLocale: typeof import("./is-locale.js").isLocale;
	deLocalizePath: typeof import("./de-localize-path.js").deLocalizePath;
	localizePath: typeof import("./localize-path.js").localizePath;
	localeInPath: typeof import("./locale-in-path.js").localeInPath;
	detectLocaleFromRequest: typeof import("./detect-locale-from-request.js").detectLocaleFromRequest;
};

/**
 * Locale is any here because the locale is unknown before compilation.
 */
type Locale = any;
