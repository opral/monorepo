import type { RouteHandler } from "../create-lsp-handler.js";

export const route: RouteHandler = async (context) => {
	const body = await context.request.blob();

	if (!body) {
		return new Response(null, {
			status: 400,
		});
	}

	throw new Error("Not implemented");
};
