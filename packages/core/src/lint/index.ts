import type { Resource, Message, Pattern } from '../ast/schema.js'
import type { Config } from '../config/schema.js'
import type { LintableNode, LintedNode, LintRule, LintType, TargetReferenceParameterTuple } from './schema.js'

const getResourceForLanguage = (resources: Resource[], language: string) =>
	resources.find(({ languageTag }) => languageTag.name === language);

const getLintRulesFromConfig = (config: Config) => {
	const { lint } = config
	if (!lint) return []

	return lint.rules
}

const createReporter = (id: string) => {
	const report = (type: LintType, node: LintableNode | undefined, message: string, metadata?: unknown) => {
		if (!node) return

		node.lint = [
			...((node as LintedNode).lint || []),
			{
				id,
				type,
				message,
				...(metadata ? { metadata } : undefined)
			}
		]
	}

	return {
		reportError: report.bind(undefined, 'error'),
		reportWarning: report.bind(undefined, 'warning')
	}
}

export const lint = async (config: Config) => {
	const { referenceLanguage, languages, readResources } = config

	const lintRules = getLintRulesFromConfig(config)
	if (!lintRules.length) {
		console.warn('No lint rules specified. Aborting ...')
		return
	}

	const resources = structuredClone(await readResources({ config }));

	const reference = getResourceForLanguage(resources, referenceLanguage);

	// TODO: process this in parallel to speed things up
	for (const lintRule of lintRules) {
		const reporter = createReporter(lintRule.id)

		const payload = await lintRule.initialize({ referenceLanguage, languages, reporter })

		for (const language of languages) {
			const target = getResourceForLanguage(resources, language);

			await processResource(
				lintRule,
				target as Resource,
				reference,
				payload,
			)
		}

		if (lintRule.teardown) {
			await lintRule.teardown(payload)
		}
	}

	return resources
}

export type LintParameters<Node extends LintableNode> = [LintRule, ...TargetReferenceParameterTuple<Node>, unknown]

// --------------------------------------------------------------------------------------------------------------------

const shouldProcessResourceChildren = (lintRule: LintRule) =>
	!!lintRule.visitors.Message || shouldProcessMessageChildren(lintRule)

const processResource = async (...[lintRule, target, reference, payloadInitial]: LintParameters<Resource>): Promise<void> => {
	const { enter, leave } = lintRule.visitors.Resource || {}

	const payloadEnter = enter
		? await enter(target as Resource, reference, payloadInitial)
		: payloadInitial
	if (payloadEnter === 'skip') return

	// process children
	if (shouldProcessResourceChildren(lintRule)) {
		const processedReferenceMessages = new Set<string>()

		for (const targetMessage of target?.body || []) {
			const referenceMessage = reference?.body.find(({ id }) => id.name === targetMessage.id.name)

			await processMessage(lintRule, targetMessage, referenceMessage, payloadEnter)

			if (referenceMessage) {
				processedReferenceMessages.add(referenceMessage.id.name)
			}
		}

		const nonVisitedReferenceMessages = (reference?.body || [])
			.filter(({ id }) => !processedReferenceMessages.has(id.name))
		for (const referenceNode of nonVisitedReferenceMessages) {
			await processMessage(lintRule, undefined, referenceNode, payloadEnter)
			processedReferenceMessages.add(referenceNode.id.name)
		}
	}

	if (leave) {
		await leave(target as Resource, reference, payloadEnter)
	}
}

// --------------------------------------------------------------------------------------------------------------------

const shouldProcessMessageChildren = (lintRule: LintRule) => !!lintRule.visitors.Pattern

const processMessage = async (...[lintRule, target, reference, payloadInitial]: LintParameters<Message>): Promise<void> => {
	const { enter, leave } = lintRule.visitors.Message || {}

	const payloadEnter = enter
		? await enter(target as Message, reference as Message, payloadInitial)
		: payloadInitial
	if (payloadEnter === 'skip') return

	// process children
	if (shouldProcessMessageChildren(lintRule)) {
		await processPattern(
			lintRule,
			target?.pattern as Pattern,
			reference?.pattern,
			payloadEnter
		)
	}

	if (leave) {
		await leave(target as Message, reference, payloadEnter)
	}
}

// --------------------------------------------------------------------------------------------------------------------

const processPattern = async (...[lintRule, target, reference, payloadInitial]: LintParameters<Pattern>): Promise<void> => {
	const { enter, leave } = lintRule.visitors.Pattern || {}

	const payloadEnter = enter
		? await enter(target as Pattern, reference, payloadInitial)
		: payloadInitial
	if (payloadEnter === 'skip') return

	// process children
	// TODO: how can we iterate over Elements? We can't really match them between `target` and `resource`

	if (leave) {
		await leave(target as Pattern, reference, payloadEnter)
	}
}
