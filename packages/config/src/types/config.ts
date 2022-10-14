import type * as ast from "@inlang/ast";
import type { LanguageCode } from "../../../i18n-utilities/dist/index.js";
import type { FsPromisesSubset } from "./fsPromisesSubset.js";
import type { DocumentSelector } from "vscode";

/**
 * Inlang config schema.
 */
export type Config = {
	/**
	 * The language that other languages are validated against.
	 *
	 * In most cases, the reference language is `en` (English).
	 */
	referenceLanguage: LanguageCode;
	/**
	 * Languages of this project.
	 *
	 * The languages must include the reference language itself.
	 */
	languages: LanguageCode[];
	readResource: (args: {
		fs: FsPromisesSubset;
		languageCode: LanguageCode;
		ast: typeof ast;
	}) => Promise<ast.Resource>;
	writeResource: (args: {
		fs: FsPromisesSubset;
		resource: ast.Resource;
		languageCode: LanguageCode;
	}) => Promise<void>;
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
