import { defineMiddleware, sequence } from "astro:middleware";
import { AsyncLocalStorage } from "async_hooks";
import {
	baseLocale,
	defineGetLocale,
	type AvailableLocale,
} from "./paraglide/runtime";

const i18n = defineMiddleware((context, next) => {
	const asyncStorage = new AsyncLocalStorage<AvailableLocale>();

	defineGetLocale(() => asyncStorage.getStore() as AvailableLocale);

	return asyncStorage.run(
		(context.currentLocale as AvailableLocale) ?? baseLocale,
		next
	);
});

export const onRequest = sequence(i18n);
