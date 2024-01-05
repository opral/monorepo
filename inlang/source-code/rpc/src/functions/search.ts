import { privateEnv } from "@inlang/env-variables"
import type { Result } from "@inlang/result"
import algoliasearch, { type AlgoliaSearchOptions, type SearchClient } from "algoliasearch"

const algolia = algoliasearch as unknown as (
	appId: string,
	apiKey: string,
	options?: AlgoliaSearchOptions
) => SearchClient

export async function search(args: {
	term: string
	category?: boolean
}): Promise<Result<string, Error>> {
	if (!privateEnv.ALGOLIA_ADMIN || !privateEnv.ALGOLIA_APPLICATION) {
		throw new Error("ALGOLIA_ADMIN is not set")
	}

	const client = algolia(privateEnv.ALGOLIA_APPLICATION, privateEnv.ALGOLIA_ADMIN)
	const index = client.initIndex("registry")

	await index.setSettings({
		searchableAttributes: args.category ? ["keywords"] : ["displayName", "description", "keywords"],
	})

	const data = await index.search(args.term)
	return { data: JSON.stringify(data.hits) }
}
