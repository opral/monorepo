import type { Resource, Message, Pattern } from "../ast/schema.js"
import type { Config } from "../config/schema.js"
import { createContext, LintedResource } from "./context.js"
import type {
	LintableNode,
	LintableNodeByType,
	LintRule,
	NodeVisitor,
	NodeVisitors,
	TargetReferenceParameterTuple,
} from "./rule.js"

const getResourceForLanguage = (resources: Resource[], language: string) =>
	resources.find(({ languageTag }) => languageTag.name === language)

export const lint = async (args: {
	config: Pick<Config, "lint" | "languages" | "referenceLanguage">
	resources: Resource[]
}): Promise<LintedResource[]> => {
	const { referenceLanguage, languages, lint } = args.config
	// linting the resources should not modify args.resources.
	const resources = structuredClone(args.resources)
	if (lint === undefined || lint.rules.length === 0) {
		return args.resources
	}
	const reference = getResourceForLanguage(resources, referenceLanguage)

	await Promise.all(
		lint.rules.flat().map((lintRule) =>
			processLintRule({
				lintRule,
				referenceLanguage,
				languages,
				reference,
				resources,
			}).catch((e) => console.error(`Unexpected error in lint rule '${lintRule.id}':`, e)),
		),
	)

	return resources as LintedResource[]
}

const processLintRule = async ({
	lintRule,
	referenceLanguage,
	languages,
	reference,
	resources,
}: {
	lintRule: LintRule
	referenceLanguage: string
	languages: string[]
	reference: Resource | undefined
	resources: Resource[]
}) => {
	const { level, id, setup, visitors, teardown } = lintRule
	if (!level) return

	const context = createContext(id, level)

	const payload = await setup({ referenceLanguage, languages, context })

	for (const language of languages) {
		const target = getResourceForLanguage(resources, language)

		await processResource({
			visitors,
			target: target as Resource,
			reference,
			payload,
		})
	}

	if (teardown) {
		await teardown({ payload })
	}
}

// --------------------------------------------------------------------------------------------------------------------

const getVisitorFunctions = (visitors: NodeVisitors, node: LintableNode["type"]) => {
	const visitor = visitors[node] as
		| NodeVisitor<LintableNodeByType<LintableNode, typeof node>>
		| undefined
	if (!visitor) return { enter: undefined, leave: undefined }

	if (typeof visitor === "object") return visitor

	return { enter: visitor, leave: undefined }
}

type ProcessNodeParam<Node extends LintableNode> = TargetReferenceParameterTuple<Node> & {
	visitors: NodeVisitors
	payload: unknown
}

// --------------------------------------------------------------------------------------------------------------------

const shouldProcessResourceChildren = (visitors: NodeVisitors) =>
	!!visitors.Message || shouldProcessMessageChildren(visitors)

// TODO: test passing `undefined` for reference

const processResource = async ({
	visitors,
	target,
	reference,
	payload: payloadInitial,
}: ProcessNodeParam<Resource>): Promise<void> => {
	const { enter, leave } = getVisitorFunctions(visitors, "Resource")

	const payloadEnter =
		(enter &&
			(await enter({
				target: target as Resource,
				reference,
				payload: payloadInitial,
			}))) ??
		payloadInitial
	if (payloadEnter === "skip") return

	// process children
	if (shouldProcessResourceChildren(visitors)) {
		const processedReferenceMessages = new Set<string>()

		for (const targetMessage of (target as Resource).body) {
			const referenceMessage = reference?.body.find(({ id }) => id.name === targetMessage.id.name)

			await processMessage({
				visitors,
				target: targetMessage as Message,
				reference: referenceMessage,
				payload: payloadEnter,
			})

			if (referenceMessage) {
				processedReferenceMessages.add(referenceMessage.id.name)
			}
		}

		const nonVisitedReferenceMessages = (reference as Resource).body.filter(
			({ id }) => !processedReferenceMessages.has(id.name),
		)
		for (const referenceNode of nonVisitedReferenceMessages) {
			await processMessage({
				visitors,
				target: undefined,
				reference: referenceNode,
				payload: payloadEnter,
			})
			processedReferenceMessages.add(referenceNode.id.name)
		}
	}

	if (leave) {
		await leave({
			target: target as Resource,
			reference,
			payload: payloadEnter,
		})
	}
}

// --------------------------------------------------------------------------------------------------------------------

const shouldProcessMessageChildren = (visitors: NodeVisitors) => !!visitors.Pattern

const processMessage = async ({
	visitors,
	target,
	reference,
	payload: payloadInitial,
}: ProcessNodeParam<Message>): Promise<void> => {
	const { enter, leave } = getVisitorFunctions(visitors, "Message")

	const payloadEnter =
		(enter &&
			(await enter({
				target: target as Message,
				reference,
				payload: payloadInitial,
			}))) ??
		payloadInitial
	if (payloadEnter === "skip") return

	// process children
	if (shouldProcessMessageChildren(visitors)) {
		await processPattern({
			visitors,
			target: target?.pattern as Pattern,
			reference: reference?.pattern,
			payload: payloadEnter,
		})
	}

	if (leave) {
		await leave({
			target: target as Message,
			reference,
			payload: payloadEnter,
		})
	}
}

// --------------------------------------------------------------------------------------------------------------------

const processPattern = async ({
	visitors,
	target,
	reference,
	payload: payloadInitial,
}: ProcessNodeParam<Pattern>): Promise<void> => {
	const { enter, leave } = getVisitorFunctions(visitors, "Pattern")

	const payloadEnter =
		(enter &&
			(await enter({
				target: target as Pattern,
				reference,
				payload: payloadInitial,
			}))) ??
		payloadInitial
	if (payloadEnter === "skip") return

	// we can't really iterate over elements because we can't match them between `target` and `resource`
	// to have a consistent API, we allow both `enter` and `leave` even if `leave` does not make sense in this case

	if (leave) {
		await leave({
			target: target as Pattern,
			reference,
			payload: payloadEnter,
		})
	}
}
