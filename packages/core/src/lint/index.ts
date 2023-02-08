import type { Resource, Message, Pattern } from '../ast/schema.js'
import type { Config } from '../config/schema.js'
import type { LintableNode, LintRule, TargetReferenceParameterTuple } from './schema.js'

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

	const reference = getResourceForLanguage(resources, referenceLanguage);

	// TODO: process this in parallel to speed things up
	const results = []
	for (const lintRule of lintRules) {
		if (lintRule.initialize) {
			await lintRule.initialize({ referenceLanguage, languages })
		}

		for (const language of languages) {
			const target = getResourceForLanguage(resources, language);

			const result = await processResource(
				lintRule,
				...[target, reference] as TargetReferenceParameterTuple<Resource>,
				undefined
			)

			results.push(result)
		}

		if (lintRule.teardown) {
			await lintRule.teardown()
		}
	}

	return results
}

export type LintParameters<Node extends LintableNode> = [LintRule, ...TargetReferenceParameterTuple<Node>, unknown]

const processResource = async (...[lintRule, target, reference]: LintParameters<Resource>) => {
	const { before, lint, after } = lintRule.visit.Resource || {}

	const beforePayload = before
		? await before(...[target, reference] as TargetReferenceParameterTuple<Resource>)
		: undefined

	if (beforePayload === 'skip') return

	const processedReferenceMessages = new Set<string>()

	if (lint) {
		await lint(...[target, reference] as TargetReferenceParameterTuple<Resource>)
	}

	// process children
	for (const targetMessage of target?.body || []) {
		const referenceMessage = reference?.body.find(({ id }) => id.name === targetMessage.id.name)


		await processMessage(lintRule, targetMessage, referenceMessage, beforePayload)

		if (referenceMessage) {
			processedReferenceMessages.add(referenceMessage.id.name)
		}
	}

	const nonVisitedReferenceMessages = (reference?.body || [])
		.filter(({ id }) => !processedReferenceMessages.has(id.name))
	for (const referenceNode of nonVisitedReferenceMessages) {
		await processMessage(lintRule, undefined, referenceNode, beforePayload)
		processedReferenceMessages.add(referenceNode.id.name)
	}

	if (after) {
		await after(...[target, reference] as TargetReferenceParameterTuple<Resource>)
	}
}

const processMessage = async (...[lintRule, target, reference]: LintParameters<Message>) => {
	const { before, lint, after } = lintRule.visit.Message || {}

	const beforePayload = before
		? await before(...[target, reference] as TargetReferenceParameterTuple<Message>)
		: undefined
	if (beforePayload === 'skip') return

	if (lint) {
		await lint(...[target, reference] as TargetReferenceParameterTuple<Message>)
	}

	// process children
	await processPattern(
		lintRule,
		...[target?.pattern, reference?.pattern] as TargetReferenceParameterTuple<Pattern>,
		beforePayload
	)

	if (after) {
		await after(...[target, reference] as TargetReferenceParameterTuple<Message>)
	}
}

const processPattern = async (...[lintRule, target, reference]: LintParameters<Pattern>) => {
	const { before, lint, after } = lintRule.visit.Pattern || {}

	const beforePayload = before
		? await before(...[target, reference] as TargetReferenceParameterTuple<Pattern>)
		: undefined

	if (beforePayload === 'skip') return

	if (lint) {
		await lint(...[target, reference] as TargetReferenceParameterTuple<Pattern>)
	}

	// process children
	// TODO: how can we iterate over Elements? We can't really match them

	if (after) {
		await after(...[target, reference] as TargetReferenceParameterTuple<Pattern>)
	}
}
