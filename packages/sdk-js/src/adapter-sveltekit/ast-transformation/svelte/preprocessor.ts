import { dirname } from "node:path"
import { getConfig } from "../config.js"
import { transformCode } from './transforms.js'

type FileType = "+layout.svelte" | "+page.svelte" | "*.svelte"

export type FileInformation = {
	type: FileType
	root: boolean
}

const getFileInformation = (srcFolder: string, id: string): FileInformation | undefined => {
	if (!id.startsWith(srcFolder)) return undefined

	const path = id.replace(srcFolder, "")

	const dir = dirname(path)
	const root = dir.endsWith('/routes')

	if (path.endsWith("/+layout.svelte")) {
		return {
			type: "+layout.svelte",
			root,
		}
	}

	if (path.endsWith("/+page.svelte")) {
		return {
			type: "+page.svelte",
			root,
		}
	}

	if (path.endsWith(".svelte")) {
		return {
			type: "*.svelte",
			root: false,
		}
	}

	return undefined
}

// ------------------------------------------------------------------------------------------------

type PreprocessMarkupArgs = {
	content: string
	filename: string
}

export const preprocess = () => ({
	markup: async ({ content, filename }: PreprocessMarkupArgs) => {
		const config = await getConfig()

		const fileInformation = getFileInformation(config.srcFolder, filename)
		// eslint-disable-next-line unicorn/no-null
		if (!fileInformation) return null

		return { code: transformCode(config, content, fileInformation) }
	},
})
