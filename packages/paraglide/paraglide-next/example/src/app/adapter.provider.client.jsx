"use client";

import {
	defineGetLocale,
	defineSetLocale,
	localizedPath,
	baseLocale,
	getLocaleFromPath,
} from "./paraglide/runtime.js";

/**
 * Defines `getLocale()` and `setLocale()` for client side components.
 *
 * NextJS >13 defaults to RSC which requires an extra provider that
 * executes JS to define get locale and set locale.
 */
export default function ParaglideProviderClientSide() {
	defineGetLocale(() => {
		return getLocaleFromPath(window.location.pathname) ?? baseLocale;
	});

	defineSetLocale((newLocale) => {
		const l10nPath = localizedPath(window.location.pathname, {
			locale: newLocale,
		});
		// trigger a page reload to avoid making the main provider a client component
		// a user rarely switches locales, so this should be fine
		window.location.pathname = l10nPath;
	});

	return <></>;
}
