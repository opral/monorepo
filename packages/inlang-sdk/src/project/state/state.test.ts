import { test, expect, vi } from "vitest";
import { createProjectState } from "./state.js";
import { newLixFile, openLixInMemory } from "@lix-js/sdk";
import type { ProjectSettings } from "../../json-schema/settings.js";
import { loadProjectInMemory } from "../loadProjectInMemory.js";
import { newProject } from "../newProject.js";
import type { InlangPlugin } from "../../plugin/schema.js";

test("plugins should be re-imported if the settings have been updated", async () => {
	const mockImportPlugins = vi.hoisted(() =>
		vi.fn().mockImplementation(async (args) => {
			const plugins = args.settings.modules.map((uri: any) => {
				return { key: uri };
			});
			return { plugins, errors: [] };
		})
	);

	vi.mock(import("../../plugin/importPlugins.js"), async (importOriginal) => {
		const mod = await importOriginal();
		return {
			...mod,
			importPlugins: mockImportPlugins,
		};
	});

	const lix = await openLixInMemory({ blob: await newLixFile() });

	await lix.db
		.insertInto("file")
		.values({
			path: "/settings.json",
			data: new TextEncoder().encode(
				JSON.stringify({
					baseLocale: "en",
					locales: ["en"],
					modules: [],
				} satisfies ProjectSettings)
			),
		})
		.execute();

	const state = createProjectState({
		lix,
		settings: {
			baseLocale: "en",
			locales: ["en"],
			modules: [],
		},
	});

	const plugins1 = await state.plugins.get();

	expect(plugins1).toEqual([]);
	// expect(mockImportPlugins).toHaveBeenCalledTimes(1);

	const settings1 = {
		baseLocale: "en",
		locales: ["en"],
		modules: ["@inlang/plugin-react"],
	};

	await state.settings.set(settings1);

	const plugins2 = await state.plugins.get();
	expect(plugins2).toEqual([{ key: "@inlang/plugin-react" }]);

	await state.settings.set({
		baseLocale: "en",
		locales: ["en"],
		modules: ["@inlang/plugin-react"],
	});

	const plugins3 = await state.plugins.get();
	expect(plugins3).toEqual([{ key: "@inlang/plugin-react" }]);
	// expect(mockImportPlugins).toHaveBeenCalledTimes(2);

	state.settings.set({
		baseLocale: "en",
		locales: ["en"],
		modules: [],
	});

	const plugins4 = await state.plugins.get();

	expect(plugins4).toEqual([]);
	// expect(mockImportPlugins).toHaveBeenCalledTimes(3);
});

test("subscribing to plugins should work", async () => {
	// vite hoists the import plugin from the previous test :/
	const project = await loadProjectInMemory({ blob: await newProject() });

	const state = createProjectState({
		lix: project.lix,
		settings: {
			baseLocale: "en",
			locales: ["en"],
			modules: [],
		},
	});

	expect(await state.plugins.get()).toEqual([]);

	let pluginsFromSub: readonly InlangPlugin[] = [];
	const sub = state.plugins.subscribe((value) => {
		pluginsFromSub = value;
	});

	await project.lix.db
		.updateTable("file_internal")
		.where("path", "=", "/settings.json")
		.set({
			data: new TextEncoder().encode(
				JSON.stringify({
					baseLocale: "en",
					locales: ["en"],
					modules: ["broken-module.js"],
				})
			),
		})
		.execute();

	const plugins = await state.plugins.get();
	expect(plugins.length).toBe(1);
	expect(pluginsFromSub).toStrictEqual(plugins);
	sub.unsubscribe();
});
