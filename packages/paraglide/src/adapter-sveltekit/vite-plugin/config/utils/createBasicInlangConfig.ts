import path from "node:path"
import { PATH_TO_CWD } from "../config.js"
import type { NodeishFilesystemSubset, ProjectConfig } from "@inlang/sdk"
import { defaultSdkPluginSettings } from "./getSettings.js"

// TODO: use correct modules links
export const createBasicInlangConfig = async (fs: NodeishFilesystemSubset) => {
	await fs.mkdir(PATH_TO_CWD, { recursive: true })

	return fs.writeFile(
		path.resolve(PATH_TO_CWD, "./project.inlang.json"),
		JSON.stringify({
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [
				"../../../../../plugins/json/dist/index.js",
				"../../../../../sdk-js-plugin/dist/index.js",
			],
			settings: {
				"plugin.inlang.json": {
					pathPattern: "./languages/{languageTag}.json",
				},
				...defaultSdkPluginSettings,
			},
		} satisfies ProjectConfig),
	)
}
