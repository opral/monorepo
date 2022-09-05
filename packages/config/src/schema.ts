import { LanguageCode } from "@inlang/utilities";

/**
 * Inlang config schema.
 */
type Schema = {
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
	/** Testing whether function can be executed in sandbox. */
	testFunction: (name: string) => string;
};
