import { expect, test } from "vitest";
import { newProject } from "./newProject.js";
import { loadProjectInMemory } from "./loadProjectInMemory.js";

test("it should be possible to provide settings for testing or other purposes", async () => {
	const project = await loadProjectInMemory({
		blob: await newProject({
			settings: { baseLocale: "fr", locales: ["fr"], modules: [] },
		}),
	});
	const settings = await project.settings.get();
	expect(settings.baseLocale).toBe("fr");
	expect(settings.locales).toEqual(["fr"]);
	expect(settings.modules).toEqual([]);
});
