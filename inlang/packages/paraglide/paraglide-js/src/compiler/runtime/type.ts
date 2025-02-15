/**
 * The Paraglide runtime API.
 */
export type Runtime = {
	baseLocale: Locale;
	locales: Readonly<Locale[]>;
	strategy: typeof import("./variables.js").strategy;
	cookieName: typeof import("./variables.js").cookieName;
	urlPatterns: typeof import("./variables.js").urlPatterns;
	getLocale: typeof import("./get-locale.js").getLocale;
	setLocale: typeof import("./set-locale.js").setLocale;
	defineGetLocale: (fn: () => Locale) => void;
	defineSetLocale: (fn: (newLocale: Locale) => void) => void;
	assertIsLocale: typeof import("./assert-is-locale.js").assertIsLocale;
	isLocale: typeof import("./is-locale.js").isLocale;
	localizeHref: typeof import("./localize-href.js").localizeHref;
	deLocalizeHref: typeof import("./localize-href.js").deLocalizeHref;
	localizeUrl: typeof import("./localize-url.js").localizeUrl;
	deLocalizeUrl: typeof import("./localize-url.js").deLocalizeUrl;
	extractLocaleFromUrl: typeof import("./extract-locale-from-url.js").extractLocaleFromUrl;
	extractLocaleFromRequest: typeof import("./extract-locale-from-request.js").extractLocaleFromRequest;
	extractLocaleFromCookie: typeof import("./extract-locale-from-cookie.js").extractLocaleFromCookie;
};

/**
 * Locale is any here because the locale is unknown before compilation.
 */
type Locale = any;
