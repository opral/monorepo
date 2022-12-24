import type * as ast from "../ast/index.js";
import type { $fs, $import } from "./environment-functions/index.js";

/**
 * The environment functions.
 *
 * Read more https://inlang.com/documentation/environment-functions
 */
export type EnvironmentFunctions = {
	$fs: $fs;
	$import: $import;
};

/**
 * The inlang config function.
 *
 * Read more https://inlang.com/documentation/config
 */
export type InitializeConfig = (args: EnvironmentFunctions) => Promise<Config>;

/**
 * Inlang config schema.
 *
 * Read more https://inlang.com/documentation/config
 */
export type Config = {
	// /**
	//  * The language that other languages are validated against.
	//  *
	//  * In most cases, the reference language is `en` (English).
	//  */
	// referenceLanguage: LanguageCode;
	// /**
	//  * Languages of this project.
	//  *
	//  * The languages must include the reference language itself.
	//  */
	// languages: LanguageCode[];
	/**
	 * The bundle (id) that other bundles are validated against.
	 *
	 * In most cases, the reference bundle is `en` (English).
	 */
	referenceBundleId: string;
	/**
	 * Bundle (ids) of this project.
	 *
	 * The bundles must include the reference bundle (id) itself.
	 */
	bundleIds: string[];
	readBundles: (args: EnvironmentFunctions & {}) => Promise<ast.Bundle[]>;
	writeBundles: (
		args: EnvironmentFunctions & { bundles: ast.Bundle[] }
	) => Promise<void>;
	// ideExtension?: {
	// 	/**
	// 	 * Defines when a message is referenced.
	// 	 */
	// 	inlinePatternMatcher: (args: {
	// 		/**
	// 		 * The (code) text to match against.
	// 		 */
	// 		text: string;
	// 		$import: typeof $import;
	// 	}) => Promise<
	// 		Array<{
	// 			/**
	// 			 * The ID of the message.
	// 			 */
	// 			id: string;
	// 			/**
	// 			 * The position from where to where the pattern should be inlined.
	// 			 */
	// 			position: {
	// 				start: { line: number; character: number };
	// 				end: { line: number; character: number };
	// 			};
	// 		}>
	// 	>;
	// 	extractMessageReplacementOptions: (args: { id: string }) => string[];
	// 	/**
	// 	 * An array of VSCode DocumentSelectors.
	// 	 *
	// 	 * The document selectors specify for which files/programming languages
	// 	 * (typescript, svelte, etc.) the extension should be activated.
	// 	 *
	// 	 * See https://code.visualstudio.com/api/references/document-selector
	// 	 */
	// 	documentSelectors: DocumentSelector[];
	// };
};
