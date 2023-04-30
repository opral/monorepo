/**
 * This experiment tests a plugin API without a createPlugin function.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
import type { InlangConfig } from "@inlang/core/src/config/index.js"
import { InlangEnvironment } from "@inlang/core/src/environment/types"

export const myPlugin = ({ pluginConfig }) => {
	return {
		id: "samuelstroschein.plugin-json",
		defineConfig: (config) => {
			if (pluginConfig.pathPattern === undefined) {
				throw new Error("pathPattern is required")
			}
			config.readResources = readResources({ pluginConfig })
			config.languages = getLanguages({ pluginConfig })
		},
	}
}

type Plugin = {
	id: string
	defineConfig(config: InlangConfig): InlangConfig
}

function readResources(args: any) {}

function getLanguages(args: any) {}
