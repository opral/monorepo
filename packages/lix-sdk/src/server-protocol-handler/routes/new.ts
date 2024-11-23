import type { RouteHandler } from "../create-lsp-handler.js";

export const route: RouteHandler = async () => {
	// const body = await context.request.blob();

	return new Response("hello world", {
		status: 200,
	});

	// if (!body) {
	// 	return new Response(null, {
	// 		status: 400,
	// 	});
	// }

	// throw new Error("Not implemented");
};
