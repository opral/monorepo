import type { NewBundleNested } from "@inlang/sdk2"
import { PLUGIN_KEY, type plugin } from "../index.js"
import { parseFile } from "./parseFile.js"

export const importFiles: NonNullable<(typeof plugin)["importFiles"]> = async ({
	settings,
	files,
}) => {
	const pluginSettings = settings[PLUGIN_KEY]
	if (pluginSettings === undefined) {
		return { bundles: [] as NewBundleNested[] }
	}
	const messages = files.flatMap(parseFile)
	const bundlesIndex: Record<string, any> = {}

	for (const message of messages) {
		if (bundlesIndex[message.bundleId] === undefined) {
			bundlesIndex[message.bundleId] = {
				id: message.bundleId,
				alias: {},
				messages: [],
			}
		} else {
			bundlesIndex[message.bundleId].messages.push(message)
		}
	}

	const bundles = Object.values(bundlesIndex) as NewBundleNested[]

	return { bundles }
}
