import { writeFile } from "node:fs/promises"
import path from "node:path"
import { dedent } from "ts-dedent"
import { PATH_TO_CWD } from "../config.js"

// TODO: use correct modules link
export const createBasicInlangConfig = async () =>
	writeFile(
		path.resolve(PATH_TO_CWD, "./inlang.config.json"),
		dedent`
		{
			"sourceLanguageTag": "en",
			"languageTags": ["en", "de"],
			"modules": [
				"../../../../../plugins/json/dist/index.js",
				"../../../../../sdk-js-plugin/dist/index.js",
			],
			"settings": {
				"plugins": {
					"inlang.plugin.json": {
						"options": {
							"pathPattern": "./languages/{languageTag}.json"
						}
					}
				}
			}
		}
	`,
	)
