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

	// using astro's i18n routing locale
	const locale = context.currentLocale ?? baseLocale;

	return await asyncStorage.run(locale, next);
};

