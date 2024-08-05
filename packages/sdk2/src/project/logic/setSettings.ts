import type { Lix } from "@lix-js/sdk";
import type { ProjectSettings } from "../../schema/settings.js";
import type { ReactiveState } from "./reactiveState.js";

export async function setSettings(args: {
	newSettings: ProjectSettings;
	lix: Lix;
	reactiveState: Pick<ReactiveState, "settings">;
}) {
	const previousSettings = args.reactiveState.settings.getValue();
	if (
		previousSettings.sourceLanguageTag !== args.newSettings.sourceLanguageTag ||
		previousSettings.languageTags !== args.newSettings.languageTags
	) {
		throw new Error(
			"Changing sourceLanguageTag or languageTags is not supported in v2 and above. Use baseLocale and locales instead."
		);
	}

	const cloned = structuredClone(args.newSettings);
	cloned.languageTags = cloned.locales;
	cloned.sourceLanguageTag = cloned.baseLocale;

	await args.lix.db
		.updateTable("file")
		.where("path", "=", "/settings.json")
		.set({
			data: await new Blob([
				JSON.stringify(cloned, undefined, 2),
			]).arrayBuffer(),
		})
		.execute();
	// if successfull set next value for reactive state
	args.reactiveState.settings.next(cloned);
}
