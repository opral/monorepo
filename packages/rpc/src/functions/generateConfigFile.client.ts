// ------------------------------------------------------
// Client side code that must execute before the server side code.
// ------------------------------------------------------

import type { generateConfigFileServer } from "./generateConfigFile.js"
import { rpc } from "../client.js"
import { NodeishFilesystem, toJson } from "@inlang-git/fs"

/*
/** Wrapper function to read and filter the filesystem client side. */
export async function generateConfigFileClient(args: {
	fs: NodeishFilesystem
	resolveFrom: string
}): ReturnType<typeof generateConfigFileServer> {
	try {
		console.log("getting here")
		const filesystemAsJson = toJson({
			...args,
			// exclude files that are not relevant for the config file to reduce
			// bandwith and improve performance
			matchers: ["**/*", "!**/node_modules/**", "!**/.*", "!**/dist/*"],
		})
		// @ts-ignore - this is a client side function
		return await rpc.generateConfigFileServer({ filesystemAsJson })
	} catch (error) {
		return [undefined, error] as any
	}
}

export function withClientSidePatch(client: typeof rpc) {
	return new Proxy(client, {
		// patching client side routes
		get(target, prop) {
			if (prop === "generateConfigFile") {
				return async (...args: Parameters<typeof generateConfigFileClient>) => {
					const { generateConfigFileClient } = await import("./generateConfigFile.client.js")
					return generateConfigFileClient(...args)
				}
			}
			return (target as any)[prop]
		},
	})
}
