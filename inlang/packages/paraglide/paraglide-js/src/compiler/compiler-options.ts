import type { Runtime } from "./runtime/type.js";

export const defaultCompilerOptions = {
	outputStructure: "message-modules",
	emitGitIgnore: true,
	includeEslintDisableComment: true,
	emitPrettierIgnore: true,
	cleanOutdir: true,
	disableAsyncLocalStorage: false,
	experimentalMiddlewareLocaleSplitting: false,
	localStorageKey: "PARAGLIDE_LOCALE",
	isServer: "typeof window === 'undefined'",
	strategy: ["cookie", "globalVariable", "baseLocale"],
	cookieName: "PARAGLIDE_LOCALE",
	cookieMaxAge: 60 * 60 * 24 * 400,
	cookieDomain: "",
} as const satisfies Partial<CompilerOptions>;

export type CompilerOptions = {
	/**
	 * The path to the inlang project.
	 *
	 * @example
	 * ```diff
	 * await compile({
	 * + project: "./project.inlang",
	 *   outdir: "./src/paraglide"
	 * })
	 * ```
	 */
	project: string;
	/**
	 * The path to the output directory.
	 *
	 * @example
	 * ```diff
	 * await compile({
	 *   project: "./project.inlang",
	 * + outdir: "./src/paraglide"
	 * })
	 * ```
	 */
	outdir: string;
	/**
	 * The strategy to use for getting the locale.
	 *
	 * The order of the strategy defines the precedence of matches.
	 *
	 * For example, in `['url', 'cookie', 'baseLocale']`, the locale will be
	 * first tried to be detected in the url, then in a cookie, and finally
	 * fallback to the base locale.
	 *
	 * The default ensures that the browser takes a cookie approach,
	 * server-side takes the globalVariable (because cookie is unavailable),
	 * whereas both fallback to the base locale if not available.
	 *
	 * Custom strategies with the pattern `custom-[A-Za-z0-9]+` are supported.
	 *
	 * @default ["cookie", "globalVariable", "baseLocale"]
	 */
	strategy?: Runtime["strategy"];
	/**
	 * Whether or not to use experimental middleware locale splitting.
	 *
	 * ⚠️ This feature is experimental and only works in SSR/SSG environment
	 *   without client-side routing. Do not rely on this feature for production.
	 *
	 * This feature is part of the exploration of per locale splitting. The
	 * issue is ongoing and can be followed here [#88](https://github.com/opral/inlang-paraglide-js/issues/88).
	 *
	 * - The client bundle will tree-shake all messages (have close to 0kb JS).
	 * - The server middleware will inject the used messages into the HTML.
	 * - The client will re-trieve the messages from the injected HTML.
	 *
	 * @default false
	 */
	experimentalMiddlewareLocaleSplitting?: boolean;
	/**
	 * The name of the localStorage key to use for the localStorage strategy.
	 *
	 * @default 'PARAGLIDE_LOCALE'
	 */
	localStorageKey?: string;
	/**
	 * Tree-shaking flag if the code is running on the server.
	 *
	 * Dependent on the bundler, this flag must be adapted to
	 * enable tree-shaking.
	 *
	 * @example
	 *   // vite
	 *   isServer: "import.meta.env.SSR"
	 *
	 * @default typeof window === "undefined"
	 */
	isServer?: string;
	/**
	 * The name of the cookie to use for the cookie strategy.
	 *
	 * @default 'PARAGLIDE_LOCALE'
	 */
	cookieName?: string;
	/**
	 * The max-age in seconds of the cookie until it expires.
	 *
	 * @default 60 * 60 * 24 * 400
	 */
	cookieMaxAge?: number;
	/**
	 * The host to which the cookie will be sent.
	 * If undefined or empty, the domain attribute is omitted from the cookie, scoping it to the exact current domain only (no subdomains).
	 * If specified, the cookie will be available to the specified domain and all its subdomains.
	 *
	 * Use this when you need cookies to be shared across subdomains (e.g., between `app.example.com` and `api.example.com`).
	 * The default behavior (no domain) ensures better compatibility with server-side cookies that don't specify a domain attribute.
	 *
	 * @example
	 * ```ts
	 * // Default: exact domain only (compatible with server-side cookies)
	 * cookieDomain: undefined // Cookie: "PARAGLIDE_LOCALE=en; path=/; max-age=34560000"
	 *
	 * // Subdomain sharing: available across all subdomains
	 * cookieDomain: "example.com" // Cookie: "PARAGLIDE_LOCALE=en; path=/; max-age=34560000; domain=example.com"
	 * ```
	 *
	 * @default "" (no domain attribute, exact domain only)
	 */
	cookieDomain?: string;
	/**
	 * The `additionalFiles` option is an array of paths to additional files that should be copied to the output directory.
	 *
	 * @example
	 *
	 * ```diff
	 * await compile({
	 *   project: "./project.inlang",
	 *   outdir: "./src/paraglide",
	 *   additionalFiles: [
	 * +    "my-file.js": "console.log('hello')"
	 *   ]
	 * })
	 * ```
	 *
	 * The output will look like this:
	 *
	 * ```diff
	 *   - outdir/
	 *     - messages/
	 * +   - my-file.js
	 *     - messages.js
	 *     - runtime.js
	 * ```
	 */
	additionalFiles?: Record<string, string>;
	/**
	 * If `emitPrettierIgnore` is set to `true` a `.prettierignore` file will be emitted in the output directory. Defaults to `true`.
	 *
	 * ```diff
	 *   - outdir/
	 *     - messages/
	 * +   - .prettierignore
	 *     - messages.js
	 *     - runtime.js
	 * ```
	 *
	 * @default true
	 */
	emitPrettierIgnore?: boolean;
	/**
	 * https://inlang.com/m/gerre34r/library-inlang-paraglideJs/strategy#url
	 */
	urlPatterns?: Runtime["urlPatterns"];
	/**
	 * Whether to include an eslint-disable comment at the top of each .js file.
	 *
	 * @default true
	 */
	includeEslintDisableComment?: boolean;
	/**
	 * Replaces AsyncLocalStorage with a synchronous implementation.
	 *
	 * ⚠️ WARNING: This should ONLY be used in serverless environments
	 * like Cloudflare Workers.
	 *
	 * Disabling AsyncLocalStorage in traditional server environments
	 * risks cross-request pollution where state from one request could
	 * leak into another concurrent request.
	 */
	disableAsyncLocalStorage?: boolean;
	/**
	 * If `emitGitIgnore` is set to `true` a `.gitignore` file will be emitted in the output directory. Defaults to `true`.
	 *
	 * ```diff
	 *   - outdir/
	 *     - messages/
	 * +   - .gitignore
	 *     - messages.js
	 *     - runtime.js
	 * ```
	 *
	 * @default true
	 */
	emitGitIgnore?: boolean;
	/**
	 * The `outputStructure` defines how modules are structured in the output.
	 *
	 * - `message-modules` - Each module is a message. This is the default.
	 * - `locale-modules` - Each module is a locale.
	 *
	 * It is recommended to use `locale-modules` for development and `message-modules` for production.
	 * Bundlers speed up the dev mode by bypassing bundling which can lead to many http requests
	 * during the dev mode with `message-modules`. See https://github.com/opral/inlang-paraglide-js/issues/486.
	 *
	 * **`message-modules`**
	 *
	 * Messages have their own module which eases tree-shaking for bundlers.
	 *
	 * ```diff
	 *   - outdir/
	 *     - messages/
	 * +   - blue_elephant_tree/
	 * +     - index.js
	 * +     - en.js
	 * +     - fr.js
	 * +   - sky_phone_bottle/
	 * +     - index.js
	 * +     - en.js
	 * +     - fr.js
	 *     - ...
	 *   - messages.js
	 *   - runtime.js
	 * ```
	 *
	 * **`locale-modules`**
	 *
	 * Messages are bundled in a per locale module. Bundlers often struggle with tree-shaking this structure,
	 * which can lead to more inefficient tree-shaking and larger bundle sizes compared to `message-modules`.
	 *
	 * The benefit are substantially fewer files which is needed in large projects.
	 *
	 * ```diff
	 *   - outdir/
	 *     - messages/
	 * +     - de.js
	 * +     - en.js
	 * +     - fr.js
	 *       - ...
	 *   - messages.js
	 *   - runtime.js
	 * ```
	 *
	 * @default "message-modules"
	 */
	outputStructure?: "locale-modules" | "message-modules";
	/**
	 * Whether to clean the output directory before writing the new files.
	 *
	 * @default true
	 */
	cleanOutdir?: boolean;

	/**
	 * The file system to use. Defaults to `await import('node:fs')`.
	 *
	 * Useful for testing the paraglide compiler by mocking the fs.
	 */
	fs?: any;
};
