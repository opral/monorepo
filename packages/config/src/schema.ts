import * as ast from "@inlang/ast";
import { LanguageCode } from "../../i18n-utilities/dist/index.js";
import { FsPromisesSubset } from "./fsPromisesSubset.js";

/**
 * Inlang config schema.
 */
export type Schema = {
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
};
