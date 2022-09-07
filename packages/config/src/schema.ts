import { LanguageCode } from "@inlang/utilities";

/**
 * Inlang config schema.
 */
export type Schema = {
	/**
	 * The language that other languages are validated against.
	 *
	 * In most cases the reference language is English.
	 */
	referenceLanguage: LanguageCode;
	/**
	 * Languages of this project.
	 *
	 * The languages must include the reference language itself.
	 */
	languages: LanguageCode[];
};
