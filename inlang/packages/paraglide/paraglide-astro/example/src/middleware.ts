import { serverMiddleware } from "$paraglide/runtime";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware((context, next) => {
	return serverMiddleware(context.request, () => next());
});
