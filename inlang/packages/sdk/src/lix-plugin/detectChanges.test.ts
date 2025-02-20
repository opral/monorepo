import { expect, test } from "vitest";
import { detectChanges } from "./detectChanges.js";

import { loadProjectInMemory } from "../project/loadProjectInMemory.js";
import { newProject } from "../project/newProject.js";
import { contentFromDatabase } from "sqlite-wasm-kysely";

test("it should not detect changes if the database did not update", async () => {
	const project = await loadProjectInMemory({ blob: await newProject() });

	const detectedChanges = await detectChanges?.({
		lix: project.lix,
		before: {
			id: "random",
			path: "db.sqlite",
			data: contentFromDatabase(project._sqlite),
			metadata: {},
		},
		after: {
			id: "random",
			path: "db.sqlite",
			data: contentFromDatabase(project._sqlite),
			metadata: {},
		},
	});
	expect(detectedChanges).toEqual([]);
});
