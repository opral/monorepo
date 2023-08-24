import path from "node:path"
import { PATH_TO_CWD } from "../config.js"
import type { InlangConfig, NodeishFilesystemSubset } from "@inlang/app"
import { defaultSdkPluginSettings } from "./getSettings.js"

// TODO: use correct modules links
export const createBasicInlangConfig = async (fs: NodeishFilesystemSubset) => {
	await fs.mkdir(PATH_TO_CWD, { recursive: true })

	return fs.writeFile(
		path.resolve(PATH_TO_CWD, "./inlang.config.json"),
		JSON.stringify({
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [
				"../../../../../plugins/json/dist/index.js",
				"../../../../../sdk-js-plugin/dist/index.js",
			],
			settings: {
				"inlang.plugin.json": {
					pathPattern: "./languages/{languageTag}.json",
				},
				...defaultSdkPluginSettings,
			},
		} satisfies InlangConfig),
	)
}
