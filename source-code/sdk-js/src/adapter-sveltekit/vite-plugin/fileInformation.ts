import path, { normalize } from "node:path"
import type { TransformConfig } from "./config.js"

export type FileType =
	| "hooks.server.js"
	| "[language].json"
	| "+server.js"
	| "+layout.server.js"
	| "+layout.js"
	| "+layout.svelte"
	| "+page.server.js"
	| "+page.js"
	| "+page.svelte"
	| "*.server.js"
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

	if (
		!id.startsWith(config.cwdFolderPath) ||
		id.startsWith(path.resolve(config.cwdFolderPath, "node_modules")) ||
		id.startsWith(path.resolve(config.cwdFolderPath, ".svelte-kit"))
	)
		return undefined

	if (scriptExtensions.map((ext) => `${config.svelteKit.files.serverHooks}${ext}`).includes(id)) {
		return {
			type: "hooks.server.js",
			root: true,
		}
	}

	const { dir, name, ext } = path.parse(id)
	const root = dir === config.svelteKit.files.routes

	if (
		dir === path.resolve(config.svelteKit.files.routes, "inlang", "[language].json") &&
		name === "+server" &&
		scriptExtensions.includes(ext)
	) {
		return {
			type: "[language].json",
			root: true,
		}
	}

	if (name === "+server" && scriptExtensions.includes(ext)) {
		return {
			type: "+server.js",
			root,
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

	if (name.endsWith(".server") && scriptExtensions.includes(ext)) {
		return {
			type: "*.server.js",
			root: false,
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

// ------------------------------------------------------------------------------------------------

export const filePathForOutput = (config: TransformConfig, path: string) => {
	const relativePath = path.replace(config.cwdFolderPath, '')
	return relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
}
