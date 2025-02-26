import type { Runtime } from "../runtime/type.ts";

export type Locale = any;

export declare const {
	baseLocale,
	locales,
	strategy,
	cookieName,
	urlPatterns,
	serverAsyncLocalStorage,
	getLocale,
	setLocale,
	getUrlOrigin,
	overwriteGetLocale,
	overwriteSetLocale,
	overwriteGetUrlOrigin,
	overwriteServerAsyncLocalStorage,
	assertIsLocale,
	isLocale,
	localizeHref,
	deLocalizeHref,
	localizeUrl,
	deLocalizeUrl,
	extractLocaleFromUrl,
	extractLocaleFromRequest,
	extractLocaleFromCookie,
}: Runtime;
