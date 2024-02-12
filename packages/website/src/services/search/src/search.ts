import { privateEnv } from "@inlang/env-variables"
import type { Result } from "@inlang/result"
import algoliasearch, { type AlgoliaSearchOptions, type SearchClient } from "algoliasearch"
import { registry } from "@inlang/marketplace-registry"

const algolia = algoliasearch as unknown as (
	appId: string,
	apiKey: string,
	options?: AlgoliaSearchOptions
) => SearchClient

const client = algolia(privateEnv.ALGOLIA_APPLICATION, privateEnv.ALGOLIA_ADMIN)
const index = client.initIndex("registry")

index.setSettings({
	searchableAttributes: ["displayName", "description", "keywords"],
})

export async function search(args: {
	term: string
	category?: string
}): Promise<Result<string, Error>> {
	if (args.category) {
		const hits = []
		for (const product of registry) {
			if (product.id.split(".")[0] === args.category) {
				hits.push({
					objectID: product.uniqueID,
					...product,
				})

				// workaround to not change the ids of old libraries but still show them in apps
			} else if (product.id.split(".")[0] === "library" && args.category === "app") {
				hits.push({
					objectID: product.uniqueID,
					...product,
				})
			}
		}
		return { data: JSON.stringify(hits) }
	}

	if (!privateEnv.ALGOLIA_ADMIN || !privateEnv.ALGOLIA_APPLICATION) {
		throw new Error("ALGOLIA_ADMIN is not set")
	}

	const data = await index.search(args.term)
	return { data: JSON.stringify(data.hits) }
}
