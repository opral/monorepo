/**
 * The Paraglide runtime API.
 */
export type Runtime = {
	baseLocale: Locale;
	locales: Readonly<Locale[]>;
	getLocale: () => string;
	setLocale: (newLocale: Locale) => void;
	defineGetLocale: (fn: () => Locale) => void;
	defineSetLocale: (fn: (newLocale: Locale) => void) => void;
	assertIsLocale: typeof import("./assert-is-locale.js").assertIsLocale;
	isLocale: (locale: Locale) => locale is Locale;
	deLocalizePath: typeof import("./de-localize-path.js").deLocalizePath;
	localizePath: typeof import("./localize-path.js").localizePath;
	localeInPath: typeof import("./locale-in-path.js").localeInPath;
};

/**
 * Locale is any here because the locale is unknown before compilation.
 */
type Locale = any;
