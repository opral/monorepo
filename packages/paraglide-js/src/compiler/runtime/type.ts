/**
 * The Paraglide runtime API.
 */
export type Runtime = {
	baseLocale: UnknownLocale;
	locales: Readonly<UnknownLocale[]>;
	getLocale: () => string;
	setLocale: (newLocale: UnknownLocale) => void;
	defineGetLocale: (fn: () => UnknownLocale) => void;
	defineSetLocale: (fn: (newLocale: UnknownLocale) => void) => void;
	isLocale: (locale: UnknownLocale) => locale is UnknownLocale;
};

/**
 * A locale that is unknown before compilation.
 */
export type UnknownLocale = any;
