import { openLixInMemory } from "../../lix/open-lix-in-memory.js";
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

	const lix = await openLixInMemory({ blob });

	// setting the sync to true if a client requests the lix
	// else, the client opens the lix and it's not syncing
	await lix.db
		.updateTable("key_value")
		.set({ value: "true" })
		.where("key", "=", "#lix_sync")
		.execute();

	return new Response(await lix.toBlob(), {
		status: 200,
		headers: {
			"Content-Type": "application/octet-stream",
			"Content-Disposition": `attachment; filename="${lix_id}.bin"`,
		},
	});
};
