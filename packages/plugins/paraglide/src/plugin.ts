import type { Plugin } from "@inlang/plugin"
import { ideExtensionConfig } from "./ideExtension/config.js"
import { id, displayName, description } from "../marketplace-manifest.json"

// ------------------------------------------------------------------------------------------------

export const plugin: Plugin = {
	id: id,
	displayName,
	description,
	addCustomApi() {
		return {
			"app.inlang.ideExtension": ideExtensionConfig(),
		}
	},
}
