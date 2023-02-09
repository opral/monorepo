import type { Resource, Message, Pattern } from '../ast/schema.js'
import type { Config, EnvironmentFunctions } from '../config/schema.js'
import { createReporter } from './reporter.js';
import { getLintRulesFromConfig, LintableNode, LintableNodeByType, LintRule, NodeVisitor, NodeVisitors, TargetReferenceParameterTuple } from './rule.js';

const getResourceForLanguage = (resources: Resource[], language: string) =>
	resources.find(({ languageTag }) => languageTag.name === language);

export const lint = async (config: Config, env: EnvironmentFunctions) => {
	const { referenceLanguage, languages, readResources } = config

	const lintRules = getLintRulesFromConfig(config)
	if (!lintRules.length) {
		console.warn('No lint rules specified. Aborting ...')
		return
	}

	const resources = await readResources({ config });

	const reference = getResourceForLanguage(resources, referenceLanguage);

	await Promise.all(
		lintRules.map(lintRule =>
			processLintRule({ env, lintRule, referenceLanguage, languages, reference, resources })
		)
	)

	return resources
}

const processLintRule = async ({
	env,
	lintRule,
	referenceLanguage,
	languages,
	reference,
	resources,
}: {
	env: EnvironmentFunctions,
	lintRule: LintRule,
	referenceLanguage: string,
	languages: string[],
	reference: Resource | undefined,
	resources: Resource[]
}) => {
	const { level, id, initialize, visitors, teardown } = lintRule
	if (!level) return

	const reporter = createReporter(id, level)

	const payload = await initialize({ env, referenceLanguage, languages, reporter })

	for (const language of languages) {
		const target = getResourceForLanguage(resources, language);

		await processResource({
			visitors,
			target: target as Resource,
			reference,
			payload
		})
	}

	if (teardown) {
		await teardown(payload)
	}
}

// --------------------------------------------------------------------------------------------------------------------

const getVisitorFunctions = (visitors: NodeVisitors, node: LintableNode['type']) => {
	const visitor = visitors[node] as NodeVisitor<LintableNodeByType<LintableNode, typeof node>> | undefined
	if (!visitor) return { enter: undefined, leave: undefined }

	if (typeof visitor === 'object') return visitor

	return { enter: visitor, leave: undefined }
}

type ProcessNodeParam<Node extends LintableNode> = TargetReferenceParameterTuple<Node> & {
	visitors: NodeVisitors
	payload: unknown
}

// --------------------------------------------------------------------------------------------------------------------

const shouldProcessResourceChildren = (visitors: NodeVisitors) =>
	!!visitors.Message || shouldProcessMessageChildren(visitors)

const processResource = async ({
	visitors,
	target,
	reference,
	payload: payloadInitial
}: ProcessNodeParam<Resource>): Promise<void> => {
	const { enter, leave } = getVisitorFunctions(visitors, 'Resource')

	const payloadEnter = enter
		? await enter({ target: target as Resource, reference, payload: payloadInitial })
		: payloadInitial
	if (payloadEnter === 'skip') return

	// process children
	if (shouldProcessResourceChildren(visitors)) {
		const processedReferenceMessages = new Set<string>()

		for (const targetMessage of target?.body || []) {
			const referenceMessage = reference?.body.find(({ id }) => id.name === targetMessage.id.name)

			await processMessage({
				visitors,
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
				visitors,
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

const shouldProcessMessageChildren = (visitors: NodeVisitors) => !!visitors.Pattern

const processMessage = async ({
	visitors,
	target,
	reference,
	payload: payloadInitial
}: ProcessNodeParam<Message>): Promise<void> => {
	const { enter, leave } = getVisitorFunctions(visitors, 'Message')

	const payloadEnter = enter
		? await enter({ target: target as Message, reference, payload: payloadInitial })
		: payloadInitial
	if (payloadEnter === 'skip') return

	// process children
	if (shouldProcessMessageChildren(visitors)) {
		await processPattern({
			visitors,
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
	visitors,
	target,
	reference,
	payload: payloadInitial
}: ProcessNodeParam<Pattern>): Promise<void> => {
	const { enter, leave } = getVisitorFunctions(visitors, 'Pattern')

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
