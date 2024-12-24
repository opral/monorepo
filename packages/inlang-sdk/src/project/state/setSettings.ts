import type { Lix } from "@lix-js/sdk";
import type { ProjectSettings } from "../../json-schema/settings.js";

export async function setSettings(args: {
	newSettings: ProjectSettings;
	lix: Lix;
}) {
	const cloned = structuredClone(args.newSettings);
	cloned.languageTags = cloned.locales;
	cloned.sourceLanguageTag = cloned.baseLocale;

	await args.lix.db
		.updateTable("file")
		.where("path", "=", "/settings.json")
		.set({
			data: new TextEncoder().encode(JSON.stringify(cloned, undefined, 2)),
		})
		.execute();
}
