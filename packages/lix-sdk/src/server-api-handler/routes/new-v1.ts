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

	const { value: id } = await lix.db
		.selectFrom("key_value")
		.where("key", "=", "lix_id")
		.selectAll()
		.executeTakeFirstOrThrow();

	const exists = await context.storage.has(`lix-file-${id}`);

	if (exists) {
		return new Response(null, {
			status: 409,
		});
	}

	await context.storage.set(`lix-file-${id}`, blob);

	return new Response(JSON.stringify({ id }), {
		status: 201,
		headers: {
			"Content-Type": "application/json",
		},
	});
};
