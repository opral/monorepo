import {
	baseLocale,
	defineGetLocale,
	defineSetLocale,
} from "virtual:paraglide-astro:runtime";
import { type MiddlewareHandler } from "astro";
import { AsyncLocalStorage } from "node:async_hooks";

const asyncStorage = new AsyncLocalStorage<string>();

defineGetLocale(() => {
	const maybeLocale = asyncStorage.getStore();
	return maybeLocale ?? baseLocale;
});

defineSetLocale(() => {
	// do nothing on the server
});

export const onRequest: MiddlewareHandler = async (context, next) => {
	// const normalizedBase = normalizeBase(import.meta.env!.BASE_URL);

	const locale =
		context.currentLocale ??
		// getLocaleFromPath(context.url.pathname, normalizedBase) ??
		baseLocale;

	return await asyncStorage.run(locale, next);
};

// function normalizeBase(rawBase: string): NormalizedBase {
// 	if (rawBase === "/") return "";
// 	// if there is a trailing slash, remove it
// 	return (
// 		rawBase.endsWith("/") ? rawBase.slice(0, -1) : rawBase
// 	) as NormalizedBase;
// }

// function getLocaleFromPath(
// 	path: string,
// 	base: NormalizedBase,
// ): string | undefined {
// 	if (!path.startsWith(base)) return undefined;

// 	const withoutBasePath = path.replace(base, "");
// 	const maybeLocale = withoutBasePath.split("/").find(Boolean); // get the first segment
// 	return isAvailableLocale(maybeLocale) ? maybeLocale : undefined;
// }

// function guessTextDirection(lang: string): "ltr" | "rtl" {
// 	try {
// 		const locale = new Intl.Locale(lang);

// 		// Node
// 		if ("textInfo" in locale) {
// 			// @ts-ignore
// 			return locale.textInfo.direction;
// 		}

// 		// Spec compliant (future proofing)
// 		if ("getTextInfo" in locale) {
// 			// @ts-ignore
// 			return locale.getTextInfo().direction;
// 		}

// 		// Fallback
// 		return "ltr";
// 	} catch (e) {
// 		return "ltr";
// 	}
// }
