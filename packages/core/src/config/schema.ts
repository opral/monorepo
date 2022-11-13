import type * as ast from "../ast/index.js";
import type { FsPromisesSubset } from "./types/fsPromisesSubset.js";
import type { DocumentSelector } from "vscode";
import type { $import } from "./environment-functions/$import.js";

/**
 * Inlang config schema.
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
	 * The bunndles must include the reference bundle (id) itself.
	 */
	bundleIds: string[];
	readBundles: (args: {
		fs: FsPromisesSubset;
		// $import: typeof $import;
	}) => Promise<ast.Bundle[]>;
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
