import type { Resource, Message, Pattern } from '../ast/schema.js'
import type { Config } from '../config/schema.js'
import type { LintableNode, LintedNode, LintRule, LintType, TargetReferenceParameterTuple } from './schema.js'

class LintError extends Error { }

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

const processResource = async (...[lintRule, target, reference, payloadInitial]: LintParameters<Resource>): Promise<void> => {
	const { before, visit, after } = lintRule.visitors.Resource || {}

	const payloadBefore = before
		? await before(target as Resource, reference, payloadInitial)
		: payloadInitial
	if (payloadBefore === 'skip') return

	const processedReferenceMessages = new Set<string>()

	const payloadVisit = visit
		? await visit(target as Resource, reference, payloadBefore)
		: payloadBefore

	// process children
	for (const targetMessage of target?.body || []) {
		const referenceMessage = reference?.body.find(({ id }) => id.name === targetMessage.id.name)

		await processMessage(lintRule, targetMessage, referenceMessage, payloadVisit)

		if (referenceMessage) {
			processedReferenceMessages.add(referenceMessage.id.name)
		}
	}
	const nonVisitedReferenceMessages = (reference?.body || [])
		.filter(({ id }) => !processedReferenceMessages.has(id.name))
	for (const referenceNode of nonVisitedReferenceMessages) {
		await processMessage(lintRule, undefined, referenceNode, payloadVisit)
		processedReferenceMessages.add(referenceNode.id.name)
	}

	if (after) {
		await after(target as Resource, reference, payloadVisit)
	}
}

const processMessage = async (...[lintRule, target, reference, payloadInitial]: LintParameters<Message>): Promise<void> => {
	const { before, visit, after } = lintRule.visitors.Message || {}

	const payloadBefore = before
		? await before(target as Message, reference as Message, payloadInitial)
		: payloadInitial
	if (payloadBefore === 'skip') return

	const payloadVisit = visit
		? await visit(target as Message, reference, payloadBefore)
		: payloadBefore

	// process children
	await processPattern(
		lintRule,
		...[target?.pattern, reference?.pattern] as TargetReferenceParameterTuple<Pattern>,
		payloadVisit
	)

	if (after) {
		await after(target as Message, reference, payloadVisit)
	}
}

const processPattern = async (...[lintRule, target, reference, payloadInitial]: LintParameters<Pattern>): Promise<void> => {
	const { before, visit, after } = lintRule.visitors.Pattern || {}

	const payloadBefore = before
		? await before(target as Pattern, reference, payloadInitial)
		: payloadInitial
	if (payloadBefore === 'skip') return

	const payloadVisit = visit
		? await visit(target as Pattern, reference, payloadBefore)
		: payloadBefore

	// process children
	// TODO: how can we iterate over Elements? We can't really match them

	if (after) {
		await after(target as Pattern, reference, payloadVisit)
	}
}
