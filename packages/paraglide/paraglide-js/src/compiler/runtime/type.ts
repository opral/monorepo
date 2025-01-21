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
	deLocalizedPath: typeof import("./de-localized-path.js").deLocalizedPath;
	localizedPath: typeof import("./localized-path.js").localizedPath;
	getLocaleFromPath: typeof import("./get-locale-from-path.js").getLocaleFromPath;
};

/**
 * Locale is any here because the locale is unknown before compilation.
 */
type Locale = any;
