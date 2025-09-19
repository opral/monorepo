import { expect, test } from "vitest";
import { newProject } from "../project/newProject.js";
import { loadProjectInMemory } from "../project/loadProjectInMemory.js";
import { uuidV7 } from "@lix-js/sdk";

test("message schema stores selectors and respects bundle foreign key", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });
	const bundleId = "bundle-for-message";
	await project.db
		.insertInto("bundle")
		.values({ id: bundleId, declarations: [] })
		.execute();

	const messageId = await uuidV7({ lix: project.lix });
	const selectors = [{ type: "variable-reference" as const, name: "platform" }];

	await expect(
		project.db
			.insertInto("message")
			.values({
				id: messageId,
				bundleId,
				locale: "en",
				selectors,
			})
			.execute()
	).resolves.not.toThrow();

	const stored = await project.db
		.selectFrom("message")
		.selectAll()
		.where("id", "=", messageId)
		.executeTakeFirstOrThrow();

	expect(stored.bundleId).toBe(bundleId);
	expect(stored.locale).toBe("en");
	expect(stored.selectors).toEqual(selectors);

	await project.close();
});

test("message schema enforces bundle foreign key", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });

	await expect(
		project.db
			.insertInto("message")
			.values({
				bundleId: "missing-bundle",
				locale: "en",
				selectors: [],
			})
			.execute()
	).rejects.toThrow(/foreign key constraint/i);

	await project.close();
});
