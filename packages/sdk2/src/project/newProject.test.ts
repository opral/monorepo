import { expect, test } from "vitest";
import { defaultProjectSettings, newProject } from "./newProject.js";
import { loadProjectInMemory } from "./loadProjectInMemory.js";
import { validate } from "uuid";

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

test("it should be possible to create a project with default settings", async () => {
	const project = await loadProjectInMemory({
		blob: await newProject(),
	});
	const settings = await project.settings.get();
	// pruning old settings that might exist for legacy reasons
	delete settings.languageTags;
	delete settings.sourceLanguageTag;
	expect(settings).toStrictEqual(defaultProjectSettings);
});

test("it should have a uuid as project id", async () => {
	const project = await loadProjectInMemory({
		blob: await newProject(),
	});
	const projectId = await project.id.get();
	expect(projectId).toBeDefined();
	expect(validate(projectId)).toBe(true);
});