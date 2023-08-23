import path from "node:path"
import { dedent } from "ts-dedent"
import { PATH_TO_CWD } from "../config.js"
import type { NodeishFilesystemSubset } from "@inlang/app"

// TODO: use correct modules link
export const createBasicInlangConfig = async (fs: NodeishFilesystemSubset) => {
	await fs.mkdir(PATH_TO_CWD, { recursive: true })

	return fs.writeFile(
		path.resolve(PATH_TO_CWD, "./inlang.config.json"),
		dedent`
		{
			"sourceLanguageTag": "en",
			"languageTags": ["en", "de"],
			"modules": [
				"../../../../../plugins/json/dist/index.js",
				"../../../../../sdk-js-plugin/dist/index.js"
			],
			"settings": {
				"inlang.plugin.json": {
					"pathPattern": "./languages/{languageTag}.json"
				}
			}
		}
	`,
	)
}
