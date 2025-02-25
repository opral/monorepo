/**
 * The Paraglide runtime API.
 */
export type Runtime = {
	baseLocale: typeof import("./variables.js").baseLocale;
	locales: typeof import("./variables.js").locales;
	strategy: typeof import("./variables.js").strategy;
	cookieName: typeof import("./variables.js").cookieName;
	urlPatterns: typeof import("./variables.js").urlPatterns;
	getLocale: typeof import("./get-locale.js").getLocale;
	setLocale: typeof import("./set-locale.js").setLocale;
	getUrlOrigin: typeof import("./get-url-origin.js").getUrlOrigin;
	overwriteGetLocale: typeof import("./get-locale.js").overwriteGetLocale;
	overwriteSetLocale: typeof import("./set-locale.js").overwriteSetLocale;
	overwriteGetUrlOrigin: typeof import("./get-url-origin.js").overwriteGetUrlOrigin;
	assertIsLocale: typeof import("./assert-is-locale.js").assertIsLocale;
	isLocale: typeof import("./is-locale.js").isLocale;
	localizeHref: typeof import("./localize-href.js").localizeHref;
	deLocalizeHref: typeof import("./localize-href.js").deLocalizeHref;
	localizeUrl: typeof import("./localize-url.js").localizeUrl;
	deLocalizeUrl: typeof import("./localize-url.js").deLocalizeUrl;
	serverMiddleware: typeof import("./server-middleware.js").serverMiddleware;
	extractLocaleFromUrl: typeof import("./extract-locale-from-url.js").extractLocaleFromUrl;
	extractLocaleFromRequest: typeof import("./extract-locale-from-request.js").extractLocaleFromRequest;
	extractLocaleFromCookie: typeof import("./extract-locale-from-cookie.js").extractLocaleFromCookie;
};
