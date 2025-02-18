// @ts-expect-error - virtuao module
import * as r from "virtual:paraglide-astro:runtime";
import { type MiddlewareHandler } from "astro";
import { AsyncLocalStorage } from "node:async_hooks";
import type { Runtime } from "@inlang/paraglide-js";

// type casting
const runtime = r as Runtime;

// cross request safe storage
const asyncStorage = new AsyncLocalStorage<string>();

// retrieve the locale from the request
runtime.overwriteGetLocale(() => asyncStorage.getStore());

// do nothing on the server
runtime.overwriteSetLocale(() => {});

export const onRequest: MiddlewareHandler = async (context, next) => {
	const locale = runtime.extractLocaleFromRequest(context.request);

	return await asyncStorage.run(locale, next);
};
