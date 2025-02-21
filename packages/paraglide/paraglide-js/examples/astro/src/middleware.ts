import { serverMiddleware } from "./paraglide/runtime";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
	return serverMiddleware(context.request, ({ request }) => next(request));
});
