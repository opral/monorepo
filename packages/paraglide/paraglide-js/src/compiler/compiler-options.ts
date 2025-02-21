import type { Runtime } from "./runtime/type.js";

export const defaultCompilerOptions = {
	outputStructure: "message-modules",
	emitGitIgnore: true,
	includeEslintDisableComment: true,
	emitPrettierIgnore: true,
	strategy: ["url", "cookie", "globalVariable", "baseLocale"],
	cookieName: "PARAGLIDE_LOCALE",
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
	 * server-side takes the variable (because cookie is unavailable),
	 * whereas both fallback to the base locale if not available.
	 *
	 * @default ["url", "cookie", "variable", "baseLocale"]
	 */
	strategy?: Runtime["strategy"];
	/**
	 * The name of the cookie to use for the cookie strategy.
	 *
	 * @default 'PARAGLIDE_LOCALE'
	 */
	cookieName?: string;
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
	 * TODO documentation
	 */
	urlPatterns?: Runtime["urlPatterns"];
	/**
	 * Whether to include an eslint-disable comment at the top of each .js file.
	 *
	 * @default true
	 */
	includeEslintDisableComment?: boolean;
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
	 * Messages are bundled in a per locale module. Bundlers sometimes struggle tree-shaking this structure.
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
	 * The file system to use. Defaults to `await import('node:fs')`.
	 *
	 * Useful for testing the paraglide compiler by mocking the fs.
	 */
	fs?: any;
};
