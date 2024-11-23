import type { LspRouteHandler } from "../create-lsp-handler.js";

export const route: LspRouteHandler = async (context) => {
	const body = await context.request.blob();

	context.storage.set("new", body);

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
