import type { ProjectSettingsV2 } from "../interface.v2.js"
import type { ProjectConfigV1 } from "../interface.v1.js"

export const migrate1to2 = (config: ProjectConfigV1): ProjectSettingsV2 => {
	const migrated: ProjectSettingsV2 = {
		$schema: "https://inlang.com/schema/project-settings",
		sourceLanguageTag: config.sourceLanguageTag,
		languageTags: config.languageTags,
		modules: config.modules,
	}
	if (config.settings["project.messageLintRuleLevels"]) {
		migrated.messageLintRuleLevels = config.settings["project.messageLintRuleLevels"]
	}
	// move keys to root object
	for (const key in config.settings) {
		if (key === "project.messageLintRuleLevels") continue
		// @ts-expect-error - we know that this is a valid key
		migrated[key] = config.settings[key]
	}
	return migrated
}
