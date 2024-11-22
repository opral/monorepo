import type { paths } from "@lix-js/server-protocol";
import type { LixiumRouter } from "../../../router.js";

export default function route(router: LixiumRouter): void {
	router.post("/lsp/lix/:id/query", async (c) => {
		const id = c.req.param("id");
		const body =
			await c.req.json<
				paths["/lsp/lix/{id}/query"]["post"]["requestBody"]["content"]["application/json"]
			>();
	});
}
