import { expect, test } from "vitest";
import { setSettings } from "./setSettings.js";
import { newLixFile, openLixInMemory, uuidv4 } from "@lix-js/sdk";
import type { ProjectSettings } from "../../schema/settings.js";
import { BehaviorSubject } from "rxjs";

test("setSettings an update to baseLocale and locales should update sourceLanguageTag and languageTags", async () => {
	const lix = await openLixInMemory({ blob: await newLixFile() });
	const settings: ProjectSettings = {
		baseLocale: "en",
		locales: ["en", "fr"],
	};

	const settingsSubject = new BehaviorSubject(settings);

	await setSettings({
		newSettings: settings,
		lix,
		state: { settings$: settingsSubject },
	});

	const updatedSettings = settingsSubject.getValue();
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

	const settingsSubject = new BehaviorSubject(settings);

	await expect(() =>
		setSettings({
			newSettings: {
				...settings,
				sourceLanguageTag: "fr",
				languageTags: ["en", "fr"],
			},
			lix,
			state: { settings$: settingsSubject },
		})
	).rejects.toThrow();
});

test("it should mutate the settings object in case an error is thrown", async () => {
	const lix = await openLixInMemory({ blob: await newLixFile() });
	const settings: ProjectSettings = {
		baseLocale: "en",
		locales: ["en", "fr"],
	};

	const settingsSubject = new BehaviorSubject(settings);

	await setSettings({
		newSettings: settings,
		lix,
		state: { settings$: settingsSubject },
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

	const settingsSubject = new BehaviorSubject(settings);

	await setSettings({
		newSettings: settings,
		lix,
		state: { settings$: settingsSubject },
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
