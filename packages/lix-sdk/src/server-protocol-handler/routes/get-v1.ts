import {
	contentFromDatabase,
	createInMemoryDatabase,
	importDatabase,
} from "sqlite-wasm-kysely";
import type { LixServerProtocolHandlerRoute } from "../create-server-protocol-handler.js";

export const route: LixServerProtocolHandlerRoute = async (context) => {
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

	// setting the sync to true if a client requests the lix
	// else, the client opens the lix and it's not syncing
	//
	// - not opening via openLix because that would trigger
	//   the sync process
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});

	importDatabase({
		db: sqlite,
		content: new Uint8Array(await blob!.arrayBuffer()),
	});

	sqlite.exec(
		"UPDATE key_value SET value = json('true') WHERE key = 'lix_sync'"
	);

	const blob2 = new Blob([contentFromDatabase(sqlite)]);

	return new Response(blob2, {
		status: 200,
		headers: {
			"Content-Type": "application/octet-stream",
			"Content-Disposition": `attachment; filename="${lix_id}.bin"`,
		},
	});
};
