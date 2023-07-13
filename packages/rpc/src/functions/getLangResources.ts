import type { Result } from "@inlang/core/utilities"
import * as fs from "node:fs"

export async function getLangResources(): Promise<Result<any, Error>> {
	try {
		const languageFiles = await fs.promises.readdir("./../website/lang")
		if (languageFiles.length === 0) {
			throw new Error("No language files found")
		}
		const dict: any = {}
		for (const languageFile of languageFiles) {
			const language = languageFile.split(".")[0]

			if (!language) throw new Error("Language file name is undefined")
			if (!languageFile.includes(".json")) throw new Error("Language file type is not json")

			const file = await fs.promises.readFile(`./../website/lang/${languageFile}`, {
				encoding: "utf-8",
			})
			dict[language] = JSON.parse(file)
		}
		return [dict]
	} catch (error) {
		return [undefined, error as Error]
	}
}
