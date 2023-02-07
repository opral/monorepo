import type { Resource } from '../ast/schema.js'
import type { Config } from '../config/schema.js'
import type { LintRule } from './schema.js'

class LintError extends Error { }

const getResourceForLanguage = (resources: Resource[], language: string) =>
	resources.find(({ languageTag }) => languageTag.name === language);

const getLintRulesFromConfig = (config: Config) => {
	const { lint } = config
	if (!lint) return []

	return lint.rules
}

export const lint = async (config: Config) => {
	const { referenceLanguage, languages, readResources } = config

	const lintRules = getLintRulesFromConfig(config)
	if (!lintRules.length) {
		console.warn('No lint rules specified. Aborting ...')
		return
	}

	const resources = await readResources({ config });

	const referenceResource = getResourceForLanguage(resources, referenceLanguage);
	if (!referenceResource) {
		throw new LintError(`could not find Resource for referenceLanguage '${referenceLanguage}'`)
	}

	// TODO: process this in parallel to speed things up
	const results = []
	for (const lintRule of lintRules) {
		if (lintRule.initialize) {
			await lintRule.initialize({ referenceLanguage, languages })
		}

		for (const language of languages) {
			const targetResource = getResourceForLanguage(resources, language);
			if (!targetResource) {
				throw new LintError(`could not find Resource for language '${language}'`)
			}

			const result = await lintResource(lintRule, referenceResource, targetResource)

			results.push(result)
		}
	}

	return results
}


const lintResource = async (lintRule: LintRule, reference: Resource, target: Resource) => undefined