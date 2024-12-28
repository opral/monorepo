import { test, expect } from "vitest";
import { loadProjectInMemory, newProject } from "@inlang/sdk";
import { plugin } from "./plugin.js";

test("example test that loads a project with the plugin", async () => {
	const inlangFile = await newProject({
		settings: {
			baseLocale: "en",
			locales: ["en", "de"],
		},
	});

	// loading the project
	const project = await loadProjectInMemory({
		// providing the plugin
		providePlugins: [plugin],
		blob: inlangFile,
	});

	expect(await project.errors.get()).toEqual([]);

	expect((await project.plugins.get())[0]?.key).toBe(plugin.key);
});
