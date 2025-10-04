/**
 * The Paraglide runtime API.
 */
export type Runtime = {
	baseLocale: typeof import("./variables.js").baseLocale;
	locales: typeof import("./variables.js").locales;
	strategy: typeof import("./variables.js").strategy;
	cookieName: typeof import("./variables.js").cookieName;
	cookieMaxAge: typeof import("./variables.js").cookieMaxAge;
	urlPatterns: typeof import("./variables.js").urlPatterns;
	disableAsyncLocalStorage: typeof import("./variables.js").disableAsyncLocalStorage;
	serverAsyncLocalStorage: typeof import("./variables.js").serverAsyncLocalStorage;
	experimentalMiddlewareLocaleSplitting: typeof import("./variables.js").experimentalMiddlewareLocaleSplitting;
	isServer: typeof import("./variables.js").isServer;
	getLocale: typeof import("./get-locale.js").getLocale;
	setLocale: typeof import("./set-locale.js").setLocale;
	getUrlOrigin: typeof import("./get-url-origin.js").getUrlOrigin;
	overwriteGetLocale: typeof import("./get-locale.js").overwriteGetLocale;
	overwriteSetLocale: typeof import("./set-locale.js").overwriteSetLocale;
	overwriteGetUrlOrigin: typeof import("./get-url-origin.js").overwriteGetUrlOrigin;
	overwriteServerAsyncLocalStorage: typeof import("./variables.js").overwriteServerAsyncLocalStorage;
	assertIsLocale: typeof import("./assert-is-locale.js").assertIsLocale;
	isLocale: typeof import("./is-locale.js").isLocale;
	localizeHref: typeof import("./localize-href.js").localizeHref;
	deLocalizeHref: typeof import("./localize-href.js").deLocalizeHref;
	localizeUrl: typeof import("./localize-url.js").localizeUrl;
	deLocalizeUrl: typeof import("./localize-url.js").deLocalizeUrl;
	shouldRedirect: typeof import("./should-redirect.js").shouldRedirect;
	extractLocaleFromUrl: typeof import("./extract-locale-from-url.js").extractLocaleFromUrl;
	extractLocaleFromRequest: typeof import("./extract-locale-from-request.js").extractLocaleFromRequest;
	extractLocaleFromRequestAsync: typeof import("./extract-locale-from-request-async.js").extractLocaleFromRequestAsync;
	extractLocaleFromCookie: typeof import("./extract-locale-from-cookie.js").extractLocaleFromCookie;
	extractLocaleFromHeader: typeof import("./extract-locale-from-header.js").extractLocaleFromHeader;
	extractLocaleFromNavigator: typeof import("./extract-locale-from-navigator.js").extractLocaleFromNavigator;
	generateStaticLocalizedUrls: typeof import("./generate-static-localized-urls.js").generateStaticLocalizedUrls;
	trackMessageCall: typeof import("./track-message-call.js").trackMessageCall;
	defineCustomServerStrategy: typeof import("./strategy.js").defineCustomServerStrategy;
	defineCustomClientStrategy: typeof import("./strategy.js").defineCustomClientStrategy;
};
