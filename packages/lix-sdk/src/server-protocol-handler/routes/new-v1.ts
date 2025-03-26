import { openLixInMemory } from "../../lix/open-lix-in-memory.js";
import type { Lix } from "../../lix/open-lix.js";
import type { LixServerProtocolHandlerRoute } from "../create-server-protocol-handler.js";

export const route: LixServerProtocolHandlerRoute = async (context) => {
	const blob = await context.request.blob();

	let lix: Lix;

	try {
		lix = await openLixInMemory({
			blob,
			// turn off sync for server
			keyValues: [
				{ key: "lix_sync", value: "false", skip_change_control: true },
			],
		});
	} catch {
		return new Response(null, {
			status: 400,
		});
	}

	const lixId = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const exists = await context.environment.hasLix({ id: lixId.value });

	if (exists) {
		return new Response(null, {
			status: 409,
		});
	}

	await context.environment.setLix({ id: lixId.value, blob });

	return new Response(JSON.stringify({ id: lixId.value }), {
		status: 201,
		headers: {
			"Content-Type": "application/json",
		},
	});
};
