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
	deLocalizePath: typeof import("./de-localize-path.js").deLocalizePath;
	localizePath: typeof import("./localize-path.js").localizePath;
	localizeUrl: typeof import("./localize-url.js").localizeUrl;
	localizeUrlV2: typeof import("./localize-url-v2.js").localizeUrlV2;
	localizeUrlV3: typeof import("./localize-url-v3.js").localizeUrlV3;
	deLocalizeUrlV3: typeof import("./localize-url-v3.js").deLocalizeUrlV3;
	deLocalizeUrl: typeof import("./de-localize-url.js").deLocalizeUrl;
	extractLocaleFromUrl: typeof import("./extract-locale-from-url.js").extractLocaleFromUrl;
	extractLocaleFromUrlV2: typeof import("./extract-locale-from-url-v2.js").extractLocaleFromUrlV2;
	extractLocaleFromPathname: typeof import("./extract-locale-from-pathname.js").extractLocaleFromPathname;
	extractLocaleFromRequest: typeof import("./extract-locale-from-request.js").extractLocaleFromRequest;
	extractLocaleFromCookie: typeof import("./extract-locale-from-cookie.js").extractLocaleFromCookie;
};

/**
 * Locale is any here because the locale is unknown before compilation.
 */
type Locale = any;
