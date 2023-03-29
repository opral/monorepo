// @ts-check

// TODO: check why `dist` is needed

/**
 * @type {import("@inlang/core/dist/config").DefineConfig}
 */
export async function defineConfig(env) {
	const plugin = await env.$import(
		"https://cdn.jsdelivr.net/gh/samuelstroschein/inlang-plugin-json@1/dist/index.js",
	)

	const pluginConfig = {
		pathPattern: "./locales/{language}.json",
	}

	return {
		referenceLanguage: "en",
		languages: await plugin.getLanguages({ ...env, pluginConfig }),
		readResources: (args) => plugin.readResources({ ...args, ...env, pluginConfig }),
		writeResources: (args) => plugin.writeResources({ ...args, ...env, pluginConfig }),
	}
}
