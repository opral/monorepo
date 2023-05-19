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
	applicationId: string
}): ReturnType<typeof generateConfigFileServer> {
	const filesystemAsJson = await toJson({
		...args,
		// exclude files that are not relevant for the config file to reduce
		// bandwith and improve performance
		matchers: ["**/*", "!**/node_modules/**", "!**/.*", "!**/dist/*"],
	})
	// @ts-ignore - this is a client side function the type doesn't exist
	return await rpc.generateConfigFileServer({
		filesystemAsJson,
		applicationId: args.applicationId,
	} satisfies Parameters<typeof generateConfigFileServer>[0])
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
