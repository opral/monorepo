import type { Plugin } from "@inlang/sdk"
import type { Settings } from "./settings.js"
import { id, displayName, description } from "../marketplace-manifest.json"

export const plugin: Plugin<Settings> = {
	id: id as Plugin["id"],
	displayName,
	description,
	'loadMessages': (args)=> {
		args.settings.
	}
}
