import { expect, test } from "vitest";
import { newLixFile, openLixInMemory, uuidv4 } from "@lix-js/sdk";
import { ProjectSettings } from "../../schema/settings.js";
import { createProjectState } from "./state.js";
import { setSettings } from "./setSettings.js";

test("setSettings an update to baseLocale and locales should update sourceLanguageTag and languageTags", async () => {
	const lix = await openLixInMemory({ blob: await newLixFile() });

	const settings: ProjectSettings = {
		baseLocale: "en",
		locales: ["en", "fr"],
	};

	await lix.db
		.insertInto("file")
		.values({
			path: "/settings.json",
			data: new TextEncoder().encode(JSON.stringify(settings)),
		})
		.execute();

	await setSettings({ newSettings: settings, lix });

	const settingsFile = await lix.db
		.selectFrom("file")
		.select("data")
		.where("path", "=", "/settings.json")
		.executeTakeFirstOrThrow();

	const updatedSettings = JSON.parse(
		new TextDecoder().decode(settingsFile.data)
	) as ProjectSettings;

	expect(updatedSettings.baseLocale).toBe("en");
	expect(updatedSettings.sourceLanguageTag).toBe("en");
	expect(updatedSettings.locales).toEqual(["en", "fr"]);
	expect(updatedSettings.languageTags).toEqual(["en", "fr"]);
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

	const state = createProjectState({ settings, lix });

	await state.settings.set(settings);

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
