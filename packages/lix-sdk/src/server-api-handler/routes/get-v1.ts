import type { LixServerApiHandlerRoute } from "../create-server-api-handler.js";

export const route: LixServerApiHandlerRoute = async (context) => {
	const { lix_id } = await context.request.json();

	if (!lix_id) {
		return new Response(
			JSON.stringify({ error: "Missing required field 'lix_id'" }),
			{
				status: 400,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	}

	const exists = await context.environment.hasLix({ id: lix_id });

	if (!exists) {
		return new Response(JSON.stringify({ error: "Lix not found" }), {
			status: 404,
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	const blob = await context.environment.getLix({ id: lix_id });

	return new Response(blob, {
		status: 200,
		headers: {
			"Content-Type": "application/octet-stream",
			"Content-Disposition": `attachment; filename="${lix_id}.bin"`,
		},
	});
};
