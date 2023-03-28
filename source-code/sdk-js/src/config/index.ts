import {
	Config as InlangConfig,
	EnvironmentFunctions,
	initialize$import,
} from "@inlang/core/config"

// this is a copy from `source-code/website/src/pages/editor/@host/@owner/@repository/State.tsx`
// TODO: move functionality into `core/config`

async function readInlangConfig(args: {
	fs: typeof import("memfs").fs
}): Promise<InlangConfig | undefined> {
	try {
		const environmentFunctions: EnvironmentFunctions = {
			$import: initialize$import({
				workingDirectory: "/",
				fs: args.fs.promises,
				fetch,
			}),
			$fs: args.fs.promises,
		}
		const file = await args.fs.promises.readFile("./inlang.config.js", "utf-8")
		const withMimeType =
			"data:application/javascript;base64," + Buffer.from(file).toString("base64")

		const module = await import(/* @vite-ignore */ withMimeType)
		const config: InlangConfig = await module.defineConfig({
			...environmentFunctions,
		})

		return config
	} catch (error) {
		// TODO: don't throw errors
		if ((error as Error).message.includes("ENOENT")) {
			// the config does not exist
			return undefined
		} else {
			throw error
		}
	}
}

export const initConfig = (args: { fs: typeof import("memfs").fs }) => {
	const config = readInlangConfig({ fs: args.fs })

	return config
}
