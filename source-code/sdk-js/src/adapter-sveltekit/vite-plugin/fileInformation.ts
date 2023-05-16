import path, { normalize } from "node:path"
import type { TransformConfig } from "./config.js"

export type FileType =
	| "hooks.server.js"
	| "[language].json"
	| "+layout.server.js"
	| "+layout.js"
	| "+layout.svelte"
	| "+page.server.js"
	| "+page.js"
	| "+page.svelte"
	| "*.js"
	| "*.svelte"

export type FileInformation = {
	type: FileType
	root: boolean
}

const scriptExtensions = [".js", ".ts"]

export const getFileInformation = (
	config: TransformConfig,
	rawId: string,
): FileInformation | undefined => {
	const id = normalize(rawId)

	if (!id.startsWith(config.srcFolder)) return undefined

	const filePath = id.replace(config.srcFolder, "")
	const { dir, name, ext } = path.parse(filePath)

	const root = dir === `${path.sep}routes`

	if (dir === path.sep && name === "hooks.server" && scriptExtensions.includes(ext)) {
		return {
			type: "hooks.server.js",
			root: true,
		}
	}

	if (
		dir === `${path.sep}routes${path.sep}inlang${path.sep}[language].json` &&
		name === "+server" &&
		scriptExtensions.includes(ext)
	) {
		return {
			type: "[language].json",
			root: true,
		}
	}

	if (name === "+layout.server" && scriptExtensions.includes(ext)) {
		return {
			type: "+layout.server.js",
			root,
		}
	}
	if (name === "+layout" && scriptExtensions.includes(ext)) {
		return {
			type: "+layout.js",
			root,
		}
	}
	if (name === "+layout" && ext === ".svelte") {
		return {
			type: "+layout.svelte",
			root,
		}
	}

	if (name === "+page.server" && scriptExtensions.includes(ext)) {
		return {
			type: "+page.server.js",
			root,
		}
	}
	if (name === "+page" && scriptExtensions.includes(ext)) {
		return {
			type: "+page.js",
			root,
		}
	}
	if (name === "+page" && ext === ".svelte") {
		return {
			type: "+page.svelte",
			root,
		}
	}

	if (scriptExtensions.includes(ext)) {
		return {
			type: "*.js",
			root: false,
		}
	}
	if (ext === ".svelte") {
		return {
			type: "*.svelte",
			root: false,
		}
	}

	return undefined
}
