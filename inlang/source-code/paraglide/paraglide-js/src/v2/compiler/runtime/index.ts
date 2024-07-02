import type { ProjectSettings } from "@inlang/sdk"
import template from "./runtime.js.template?raw"

/**
 * Returns the code for the `runtime.js` module
 */
export function createRuntime(
	opts: Pick<ProjectSettings, "languageTags" | "sourceLanguageTag">
): string {
	return template
		.replace("{{sourceLanguageTag}}", opts.sourceLanguageTag)
		.replace("{{languageTags}}", JSON.stringify(opts.languageTags))
}
