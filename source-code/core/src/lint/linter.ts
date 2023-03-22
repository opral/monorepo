import type { Resource, Message, Pattern } from "../ast/schema.js"
import type { Config } from "../config/schema.js"
import type { Context, LintedResource } from "./context.js"
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

const processLintRule = async (args: {
	lintRule: LintRule
	referenceLanguage: string
	languages: string[]
	reference: Resource | undefined
	resources: Resource[]
}) => {
	if (!args.lintRule) return

	for (const language of args.languages) {
		await processResource({
			context: {
				...args,
				target: getResourceForLanguage(args.resources, language),
			},
			visitors: args.lintRule.visitors,
		})
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
	context: Context
}

// --------------------------------------------------------------------------------------------------------------------

const shouldProcessResourceChildren = (visitors: NodeVisitors) =>
	!!visitors.Message || shouldProcessMessageChildren(visitors)

// TODO: test passing `undefined` for reference

const processResource = async ({
	visitors,
	context,
}: ProcessNodeParam<Resource>): Promise<void> => {
	const { enter, leave } = getVisitorFunctions(visitors, "Resource")

	const returnOfEnter = enter && (await enter(context))
	if (returnOfEnter === "skip") {
		return
	}

	// process children
	if (shouldProcessResourceChildren(visitors)) {
		const processedReferenceMessages = new Set<string>()

		for (const targetMessage of (context.target as Resource).body) {
			const referenceMessage = (context.reference as Resource)?.body.find(
				({ id }) => id.name === targetMessage.id.name,
			)

			await processMessage({
				visitors,
				context,
			})

			if (referenceMessage) {
				processedReferenceMessages.add(referenceMessage.id.name)
			}
		}

		const nonVisitedReferenceMessages = (context.reference as Resource).body.filter(
			({ id }) => !processedReferenceMessages.has(id.name),
		)
		for (const referenceNode of nonVisitedReferenceMessages) {
			await processMessage({
				visitors,
				context,
			})
			processedReferenceMessages.add(referenceNode.id.name)
		}
	}

	if (leave) {
		await leave(context)
	}
}

// --------------------------------------------------------------------------------------------------------------------

const shouldProcessMessageChildren = (visitors: NodeVisitors) => !!visitors.Pattern

const processMessage = async ({ visitors, context }: ProcessNodeParam<Message>): Promise<void> => {
	const { enter, leave } = getVisitorFunctions(visitors, "Message")

	const returnOfEnter = enter && (await enter(context))
	if (returnOfEnter === "skip") {
		return
	}

	// process children
	if (shouldProcessMessageChildren(visitors)) {
		await processPattern({
			visitors,
			context,
		})
	}

	if (leave) {
		await leave(context)
	}
}

// --------------------------------------------------------------------------------------------------------------------

const processPattern = async ({ visitors, context }: ProcessNodeParam<Pattern>): Promise<void> => {
	const { enter, leave } = getVisitorFunctions(visitors, "Pattern")

	const returnOfEnter = enter && (await enter(context))
	if (returnOfEnter === "skip") {
		return
	}

	// we can't really iterate over elements because we can't match them between `target` and `resource`
	// to have a consistent API, we allow both `enter` and `leave` even if `leave` does not make sense in this case

	if (leave) {
		await leave(context)
	}
}
