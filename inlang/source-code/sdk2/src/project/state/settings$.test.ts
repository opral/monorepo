import { expect, test } from "vitest";
import { createSettings$ } from "./settings$.js";
import { newLixFile, openLixInMemory } from "@lix-js/sdk";
import type { ProjectSettings } from "../../json-schema/settings.js";
import { firstValueFrom } from "rxjs";
import { withLanguageTagToLocaleMigration } from "../../migrations/v2/withLanguageTagToLocaleMigration.js";

test("if the settings file has been updated in lix, the observable should emit the new settings", async () => {
	const lix = await openLixInMemory({ blob: await newLixFile() });

	const mockSettings: ProjectSettings = {
		baseLocale: "en",
		locales: ["en", "de"],
		modules: [],
	};

	await lix.db
		.insertInto("file")
		.values({
			path: "/settings.json",
			data: new TextEncoder().encode(JSON.stringify(mockSettings)),
		})
		.execute();

	const settings$ = createSettings$({ lix });

	// todo the emitted events are always too high
	// that could be due to polling. not important rn.
	// let emittedEvents = 0;
	// settings$.subscribe(() => {
	// 	emittedEvents++;
	// });

	const settings = await firstValueFrom(settings$);

	expect(settings).toStrictEqual(
		withLanguageTagToLocaleMigration(mockSettings)
	);

	settings.baseLocale = "mock-locale";

	// mutating a value from the observable should not affect the observable
	const settings2 = await firstValueFrom(settings$);
	expect(settings2.baseLocale).toBe("en");

	await lix.db
		.updateTable("file")
		.where("file.path", "=", "/settings.json")
		.set({
			data: new TextEncoder().encode(JSON.stringify(settings)),
		})
		.execute();

	const settings3 = await firstValueFrom(settings$);
	expect(settings3.baseLocale).toBe("mock-locale");
});
