import { paraglideMiddleware } from "./paraglide/server";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
	return paraglideMiddleware(context.request, ({ request }) => next(request));
});
