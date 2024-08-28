import { expect, test, vi } from "vitest";
import { setSettings } from "./setSettings.js";
import { newLixFile, openLixInMemory, uuidv4 } from "@lix-js/sdk";
import type { ProjectSettings } from "../../schema/settings.js";
import { createState } from "./state.js";

test("setSettings an update to baseLocale and locales should update sourceLanguageTag and languageTags", async () => {
	const lix = await openLixInMemory({ blob: await newLixFile() });
	const settings: ProjectSettings = {
		baseLocale: "en",
		locales: ["en", "fr"],
	};

	const state = await createState({ settings });

	await setSettings({
		newSettings: settings,
		lix,
		state,
	});

	const updatedSettings = state.settings$.getValue();
	expect(updatedSettings.baseLocale).toBe("en");
	expect(updatedSettings.sourceLanguageTag).toBe("en");
	expect(updatedSettings.locales).toEqual(["en", "fr"]);
	expect(updatedSettings.languageTags).toEqual(["en", "fr"]);
});

test("it should throw if sourceLanguageTag or languageTags are changed to enforce a migration to baseLocale and locales", async () => {
	const lix = await openLixInMemory({ blob: await newLixFile() });
	const settings: ProjectSettings = {
		baseLocale: "en",
		locales: ["en", "fr"],
	};

	const state = await createState({ settings });

	await expect(() =>
		setSettings({
			newSettings: {
				...settings,
				sourceLanguageTag: "fr",
				languageTags: ["en", "fr"],
			},
			lix,
			state,
		})
	).rejects.toThrow();
});

test("it should mutate the settings object in case an error is thrown", async () => {
	const lix = await openLixInMemory({ blob: await newLixFile() });
	const settings: ProjectSettings = {
		baseLocale: "en",
		locales: ["en", "fr"],
	};

	const state = await createState({ settings });

	await setSettings({
		newSettings: settings,
		lix,
		state,
	});

	expect(settings).toStrictEqual(settings);
});

test("the settings should be persisted to lix", async () => {
	const lix = await openLixInMemory({ blob: await newLixFile() });

	await lix.db
		.insertInto("file")
		.values({
			id: uuidv4(),
			path: "/settings.json",
			data: new TextEncoder().encode("{}"),
		})
		.execute();

	const settings: ProjectSettings = {
		baseLocale: "en",
		locales: ["en", "fr"],
	};

	const state = await createState({ settings });

	await setSettings({
		newSettings: settings,
		lix,
		state,
	});

	const settingsFile = await lix.db
		.selectFrom("file")
		.select("data")
		.where("path", "=", "/settings.json")
		.executeTakeFirstOrThrow();

	const updatedSettingsInLix = JSON.parse(
		new TextDecoder().decode(settingsFile.data)
	) as ProjectSettings;

	expect(updatedSettingsInLix.baseLocale).toEqual("en");
	expect(updatedSettingsInLix.locales).toEqual(["en", "fr"]);
});

// test.todo(
// 	"plugins should be re-imported if the settings have been updated",
// 	async () => {
// 		const mockImportPlugins = vi.hoisted(() =>
// 			vi.fn().mockImplementation(async (args) => {
// 				console.log("importing plugins");
// 				const plugins = args.settings.modules.map((uri: any) => {
// 					return { key: uri };
// 				});
// 				return { plugins, errors: [] };
// 			})
// 		);

// 		vi.mock(import("../../plugin/importPlugins.js"), async (importOriginal) => {
// 			const mod = await importOriginal();
// 			return {
// 				...mod,
// 				importPlugins: mockImportPlugins,
// 			};
// 		});

// 		const lix = await openLixInMemory({ blob: await newLixFile() });

// 		const state = await createState({
// 			settings: {
// 				baseLocale: "en",
// 				locales: ["en"],
// 				modules: [],
// 			},
// 		});

// 		const plugins1 = state.plugins$.getValue();

// 		expect(plugins1).toEqual([]);
// 		// expect(mockImportPlugins).toHaveBeenCalledTimes(1);

// 		await setSettings({
// 			newSettings: {
// 				baseLocale: "en",
// 				locales: ["en"],
// 				modules: ["@inlang/plugin-react"],
// 			},
// 			lix,
// 			state,
// 		});

// 		await setSettings({
// 			newSettings: {
// 				baseLocale: "en",
// 				locales: ["en"],
// 				modules: ["@inlang/plugin-react"],
// 			},
// 			lix,
// 			state,
// 		});

// 		const plugins2 = state.plugins$.getValue();

// 		expect(plugins2).toEqual([{ key: "@inlang/plugin-react" }]);
// 		// expect(mockImportPlugins).toHaveBeenCalledTimes(2);

// 		await setSettings({
// 			newSettings: {
// 				baseLocale: "en",
// 				locales: ["en"],
// 				modules: ["@inlang/plugin-react"],
// 			},
// 			lix,
// 			state,
// 		});

// 		const plugins3 = state.plugins$.getValue();
// 		expect(plugins3).toEqual([{ key: "@inlang/plugin-react" }]);
// 		// expect(mockImportPlugins).toHaveBeenCalledTimes(2);

// 		await setSettings({
// 			newSettings: {
// 				baseLocale: "en",
// 				locales: ["en"],
// 				modules: [],
// 			},
// 			lix,
// 			state,
// 		});

// 		const plugins4 = state.plugins$.getValue();
// 		// mockSubscription.unsubscribe();

// 		expect(plugins4).toEqual([]);
// 		// expect(mockImportPlugins).toHaveBeenCalledTimes(3);
// 	}
// );
