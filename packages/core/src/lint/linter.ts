import type { Resource, Message, Pattern } from '../ast/schema.js'
import type { Config } from '../config/schema.js'
import { createReporter } from './reporter.js';
import { getLintRulesFromConfig, LintableNode, LintRule, TargetReferenceParameterTuple } from './rule.js';

const getResourceForLanguage = (resources: Resource[], language: string) =>
	resources.find(({ languageTag }) => languageTag.name === language);

export const lint = async (config: Config) => {
	const { referenceLanguage, languages, readResources } = config

	const lintRules = getLintRulesFromConfig(config)
	if (!lintRules.length) {
		console.warn('No lint rules specified. Aborting ...')
		return
	}

	const resources = structuredClone(await readResources({ config }));

	const reference = getResourceForLanguage(resources, referenceLanguage);

	for (const lintRule of lintRules) {
		if (!lintRule.type) continue

		const reporter = createReporter(lintRule.id, lintRule.type)

		const payload = await lintRule.initialize({ referenceLanguage, languages, reporter })

		for (const language of languages) {
			const target = getResourceForLanguage(resources, language);

			await processResource({
				lintRule,
				target: target as Resource,
				reference,
				payload
			})
		}

		if (lintRule.teardown) {
			await lintRule.teardown(payload)
		}
	}

	return resources
}

export type ProcessNodeParam<Node extends LintableNode> = TargetReferenceParameterTuple<Node> & {
	lintRule: LintRule
	payload: unknown
}

// --------------------------------------------------------------------------------------------------------------------

const shouldProcessResourceChildren = (lintRule: LintRule) =>
	!!lintRule.visitors.Message || shouldProcessMessageChildren(lintRule)

const processResource = async ({
	lintRule,
	target,
	reference,
	payload: payloadInitial
}: ProcessNodeParam<Resource>): Promise<void> => {
	const { enter, leave } = lintRule.visitors.Resource || {}

	const payloadEnter = enter
		? await enter({ target: target as Resource, reference, payload: payloadInitial })
		: payloadInitial
	if (payloadEnter === 'skip') return

	// process children
	if (shouldProcessResourceChildren(lintRule)) {
		const processedReferenceMessages = new Set<string>()

		for (const targetMessage of target?.body || []) {
			const referenceMessage = reference?.body.find(({ id }) => id.name === targetMessage.id.name)

			await processMessage({
				lintRule,
				target: targetMessage as Message,
				reference: referenceMessage,
				payload: payloadEnter
			})

			if (referenceMessage) {
				processedReferenceMessages.add(referenceMessage.id.name)
			}
		}

		const nonVisitedReferenceMessages = (reference?.body || [])
			.filter(({ id }) => !processedReferenceMessages.has(id.name))
		for (const referenceNode of nonVisitedReferenceMessages) {
			await processMessage({
				lintRule,
				target: undefined,
				reference: referenceNode,
				payload: payloadEnter
			})
			processedReferenceMessages.add(referenceNode.id.name)
		}
	}

	if (leave) {
		await leave({ target: target as Resource, reference, payload: payloadEnter })
	}
}

// --------------------------------------------------------------------------------------------------------------------

const shouldProcessMessageChildren = (lintRule: LintRule) => !!lintRule.visitors.Pattern

const processMessage = async ({
	lintRule,
	target,
	reference,
	payload: payloadInitial
}: ProcessNodeParam<Message>): Promise<void> => {
	const { enter, leave } = lintRule.visitors.Message || {}

	const payloadEnter = enter
		? await enter({ target: target as Message, reference, payload: payloadInitial })
		: payloadInitial
	if (payloadEnter === 'skip') return

	// process children
	if (shouldProcessMessageChildren(lintRule)) {
		await processPattern({
			lintRule,
			target: target?.pattern as Pattern,
			reference: reference?.pattern,
			payload: payloadEnter
		})
	}

	if (leave) {
		await leave({ target: target as Message, reference, payload: payloadEnter })
	}
}

// --------------------------------------------------------------------------------------------------------------------

const processPattern = async ({
	lintRule,
	target,
	reference,
	payload: payloadInitial
}: ProcessNodeParam<Pattern>): Promise<void> => {
	const { enter, leave } = lintRule.visitors.Pattern || {}

	const payloadEnter = enter
		? await enter({ target: target as Pattern, reference, payload: payloadInitial })
		: payloadInitial
	if (payloadEnter === 'skip') return

	// process children
	// TODO: how can we iterate over Elements? We can't really match them between `target` and `resource`

	if (leave) {
		await leave({ target: target as Pattern, reference, payload: payloadEnter })
	}
}
