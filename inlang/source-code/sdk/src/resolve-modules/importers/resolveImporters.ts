import type { ResolveImportersFunction } from "./types.js"

export const resolveImporters: ResolveImportersFunction = async ({
	settings,
	importers,
	nodeishFs,
}) => {
	return {
		data: {
			importMessages: async () => {
				const importPromises = importers.map(
					async (importer) =>
						await importer.importMessages({
							settings,
							nodeishFs,
						})
				)

				const messageBundles = (await Promise.all(importPromises)).flat()
				return messageBundles
			},
		},
		errors: [],
	}
}
