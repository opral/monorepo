import { openLixInMemory } from "../../lix/open-lix-in-memory.js";
import type { Lix } from "../../lix/open-lix.js";
import type { LixServerApiHandlerRoute } from "../create-server-api-handler.js";

export const route: LixServerApiHandlerRoute = async (context) => {
	const blob = await context.request.blob();

	let lix: Lix;

	try {
		lix = await openLixInMemory({ blob, sync: false });
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
