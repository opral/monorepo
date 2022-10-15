import type * as ast from "../../ast/index.js";
import type { FsPromisesSubset } from "./fsPromisesSubset.js";
import type { DocumentSelector } from "vscode";

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
	readBundles: (args: { fs: FsPromisesSubset }) => Promise<ast.Bundle[]>;
	// readResource: (args: {
	// 	fs: FsPromisesSubset;
	// 	path: string;
	// }) => Promise<ast.Resource>;
	// writeResource: (args: {
	// 	fs: FsPromisesSubset;
	// 	resource: ast.Resource;
	// 	path: string;
	// }) => Promise<void>;
	ideExtension: {
		extractMessageReplacementOptions: (args: { id: string }) => string[];
		/**
		 * An array of VSCode DocumentSelectors.
		 *
		 * The document selectors specify for which files/programming languages
		 * (typescript, svelte, etc.) the extension should be activated.
		 *
		 * See https://code.visualstudio.com/api/references/document-selector
		 */
		documentSelectors: DocumentSelector[];
	};
};
