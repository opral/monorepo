import type { Lix } from "@lix-js/sdk";
import type { ProjectSettings } from "../../schema/settings.js";
import type { State } from "./state.js";
import dedent from "dedent";
import { isEqual } from "lodash-es";
import { importPlugins } from "../../plugin/importPlugins.js";

export async function setSettings(args: {
	newSettings: ProjectSettings;
	lix: Lix;
	state: State;
}) {
	const previousSettings = args.state.settings$.getValue();
	if (
		previousSettings.sourceLanguageTag !== args.newSettings.sourceLanguageTag ||
		// Check if the length is different, and if so,
		// check if the the tags are different
		previousSettings.languageTags?.length !==
			args.newSettings.languageTags?.length ||
		args.newSettings.languageTags?.some(
			(tag, i) => tag !== previousSettings.languageTags?.[i]
		)
	) {
		throw new Error(
			dedent`
			The sourceLanguageTag and/or languageTags differ from 
			the baseLocale and/or locales.

			Changing sourceLanguageTag or languageTags is not supported 
			in v2 and above. Use baseLocale and locales instead:

			\`\`\`diff
			-settings.sourceLanguageTag = "en";
			+settings.baseLocale = "en";
			\`\`\`
		`
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
	args.state.settings$.next(cloned);

	if (isEqual(previousSettings.modules, args.newSettings.modules) === false) {
		const { plugins, errors } = await importPlugins({
			settings: args.newSettings,
		});
		args.state.plugins$.next(plugins);
		args.state.errors$.next(errors);
	}
}
