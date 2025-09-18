import { expect, test } from "vitest";
import { newProject } from "../project/newProject.js";
import { loadProjectInMemory } from "../project/loadProjectInMemory.js";

test("bundle schema accepts JSON declarations via project.db", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });

	await expect(
		project.db
			.insertInto("bundle")
			.values({
				id: "json-enabled-bundle",
				declarations: [{ name: "namespace", type: "input-variable" }],
			})
			.execute()
	).resolves.not.toThrow();

	const inserted = await project.db
		.selectFrom("bundle")
		.selectAll()
		.where("id", "=", "json-enabled-bundle")
		.executeTakeFirstOrThrow();

	expect(inserted.declarations).toEqual([
		{ name: "namespace", type: "input-variable" },
	]);

	await project.close();
});
