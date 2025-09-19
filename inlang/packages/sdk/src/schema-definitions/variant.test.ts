import { expect, test } from "vitest";
import { uuidV7 } from "@lix-js/sdk";
import { newProject } from "../project/newProject.js";
import { loadProjectInMemory } from "../project/loadProjectInMemory.js";

test("variant schema persists matches and pattern JSON", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });
	const bundleId = "bundle-for-variant";
	await project.db
		.insertInto("bundle")
		.values({ id: bundleId, declarations: [] })
		.execute();

	const messageId = await uuidV7({ lix: project.lix });
	await project.db
		.insertInto("message")
		.values({
			id: messageId,
			bundleId,
			locale: "en",
			selectors: [],
		})
		.execute();

	const variantId = await uuidV7({ lix: project.lix });
	const matches = [
		{ type: "literal-match" as const, key: "platform", value: "web" },
	];
	const pattern = [{ type: "text" as const, value: "Hello web" }];

	await expect(
		project.db
			.insertInto("variant")
			.values({
				id: variantId,
				messageId,
				matches,
				pattern,
			})
			.execute()
	).resolves.not.toThrow();

	const stored = await project.db
		.selectFrom("variant")
		.selectAll()
		.where("id", "=", variantId)
		.executeTakeFirstOrThrow();

	expect(stored.messageId).toBe(messageId);
	expect(stored.matches).toEqual(matches);
	expect(stored.pattern).toEqual(pattern);

	await project.close();
});

test("variant schema enforces message foreign key", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });

	let wasRejected = false;
	try {
		await project.db
			.insertInto("variant")
			.values({
				id: await uuidV7({ lix: project.lix }),
				messageId: "missing-message",
				matches: [],
				pattern: [],
			})
			.execute();
	} catch (error) {
		wasRejected = true;
		expect(
			(error as any)?.resultCode ?? (error as Error).message
		).toBeDefined();
	}
	expect(wasRejected).toBe(true);

	await project.close();
});
