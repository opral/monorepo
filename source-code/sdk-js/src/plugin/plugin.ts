import { type SdkConfig, validateSdkConfig } from './schema.js'
import type { InlangConfig } from '@inlang/core/config'
import type { InlangEnvironment } from '@inlang/core/environment'
import { createPlugin } from "@inlang/core/plugin"

// ------------------------------------------------------------------------------------------------

export const sdkPlugin = createPlugin<SdkConfig>(({ settings, env }) => ({
	id: "inlang.sdk-js",
	config: async (config) => {
		const parsedConfig = validateSdkConfig(settings)

		return {
			sdk: parsedConfig,
			...(await addDefaultResourcePluginIfMissing(config, env)),
			...(await addIdeExtensionPluginIfMissing(config, env)),
		}
	},
}))

// this is currently not possible because the Plugin `config` function does not receive the existing config object
const addDefaultResourcePluginIfMissing = async (config: Partial<InlangConfig>, env: InlangEnvironment): Promise<Partial<InlangConfig>> => {
	if (config.readResources) return {}

	const plugin = await env.$import(
		"https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@1/dist/index.js",
	)

	const pluginConfig = {
		pathPattern: "./languages/{language}.json",
	}

	return {
		languages: await plugin.getLanguages({ ...env, pluginConfig }),
		readResources: (args) => plugin.readResources({ ...args, ...env, pluginConfig }),
		writeResources: (args) => plugin.writeResources({ ...args, ...env, pluginConfig }),
	}
}

const addIdeExtensionPluginIfMissing = async (config: Partial<InlangConfig>, env: InlangEnvironment): Promise<{ ideExtension?: InlangConfig['ideExtension'] }> => {
	if (config.ideExtension) return {}

	// TODO: use ideExtensionPlugin once released

	// TODO: check if correct

	return {
		ideExtension: {
			messageReferenceMatchers: [
				async (args) => {
					const regex = /(?<!\w){?t\(['"](?<messageId>\S+)['"]\)}?/gm;
					const str = args.documentText;
					let match;
					const result = [];

					while ((match = regex.exec(str)) !== null) {
						const startLine =
							(str.slice(0, Math.max(0, match.index)).match(/\n/g) || [])
								.length + 1;
						const startPos =
							match.index - str.lastIndexOf("\n", match.index - 1);
						const endPos =
							match.index +
							match[0].length -
							str.lastIndexOf("\n", match.index + match[0].length - 1);
						const endLine =
							(
								str
									.slice(0, Math.max(0, match.index + match[0].length))
									.match(/\n/g) || []
							).length + 1;

						if (match.groups && "messageId" in match.groups) {
							result.push({
								messageId: match.groups["messageId"]!,
								position: {
									start: {
										line: startLine,
										character: startPos,
									},
									end: {
										line: endLine,
										character: endPos,
									},
								},
							});
						}
					}
					return result;
				},
			],
			extractMessageOptions: [
				{
					callback: (messageId) => `{i("${messageId}")}`,
				},
			],
		}
	}
}