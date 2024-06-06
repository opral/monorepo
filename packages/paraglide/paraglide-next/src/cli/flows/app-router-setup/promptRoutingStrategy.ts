import type { Logger } from "@inlang/paraglide-js/internal"
import { CliStep } from "../../utils"
import { InlangProject } from "@inlang/sdk"
import { promptSelection, prompt } from "../../utils.js"

export type RoutingStrategy =
	| {
			type: "prefix"
	  }
	| {
			type: "cookie"
	  }
	| {
			type: "domain"
			domains: Record<string, URL>
	  }

export const promptRoutingStrategy: CliStep<
	{
		logger: Logger
		project: InlangProject
	},
	{
		routingStrategy: RoutingStrategy
	}
> = async (ctx) => {
	const selection = await promptSelection("Which routing strategy do you want to use?", {
		initial: "prefix",
		options: [
			{ label: "Path Prefix", value: "prefix" },
			{ label: "Domain", value: "domain" },
			{ label: "Cookie", value: "cookie" },
		],
	})

	switch (selection) {
		case "prefix":
		case "cookie": {
			return { routingStrategy: { type: selection }, ...ctx }
		}
		case "domain": {
			const languageTags = ctx.project.settings().languageTags

			const domains: Record<string, URL> = {}
			for (const languageTag of languageTags) {
				const domain = await promptDomainForLanguage(languageTag, ctx.logger)
				domains[languageTag] = domain
			}

			return { routingStrategy: { type: "domain", domains }, ...ctx }
		}
	}
}

async function promptDomainForLanguage(languageTag: string, logger: Logger): Promise<URL> {
	const response = await prompt(`Which domain do you want to use for "${languageTag}"?`, {
		type: "text",
		placeholder: `https://${languageTag}.example.com`,
	})

	if (URL.canParse(response)) {
		const url = new URL(response)
		if (!url.protocol.startsWith("https:")) {
			logger.warn(`Domains should use either the 'http' or 'https' protocol`)
		} else {
			return url
		}
	}

	logger.warn("Please enter a valid domain, including the protocol. Example: https://example.com")
	return await promptDomainForLanguage(languageTag, logger)
}
