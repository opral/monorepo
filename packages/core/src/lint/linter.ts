import type { InlangConfig } from "@inlang/core/config"
import type * as ast from "@inlang/core/ast"
import type { LintedResource, LintRule, Visitors } from "./rule.js"
import { createReportFunction } from "./report.js"
import type { Language } from "@inlang/core/ast"

const getResourceForLanguage = (resources: ast.Resource[], language: string) =>
	resources.find(({ languageTag }) => languageTag.name === language)

/**
 * Lints the given resources.
 *
 * The linted resources will be returned with lint information added to each node.
 * The returned errors are unexpected errors that occurred during linting, not
 * lint errors themselves.
 *
 * @example
 *   const [lintedResources, errors] = await lint({ config, resources })
 *   if (errors) {
 *     // handle unexpected errors during the linting process.
 *     // this errors are not lint errors themselves!
 *   }
 *   const lints = getLintReports(lintedResources, { options })
 */
export const lint = async (args: {
	config: Pick<InlangConfig, "lint" | "languages" | "referenceLanguage">
	resources: ast.Resource[]
}): Promise<[lintedResources: LintedResource[], errors?: Error[]]> => {
	const { referenceLanguage, languages, lint } = args.config
	const resources = structuredClone(args.resources)
	if (lint === undefined || lint.rules.length === 0) {
		return [args.resources, []]
	}
	const reference = getResourceForLanguage(resources, referenceLanguage)
	const errors: Error[] = []

	await Promise.all(
		lint.rules.flat().map((rule) =>
			processLintRule({
				rule,
				referenceLanguage,
				languages,
				reference,
				resources,
			}).catch((e) =>
				errors.push(new Error(`Unexpected error in lint rule '${rule.id}'`, { cause: e })),
			),
		),
	)

	return [resources as LintedResource[], errors.length > 0 ? errors : undefined]
}

const processLintRule = async (args: {
	rule: LintRule
	referenceLanguage: Language
	languages: Language[]
	reference: ast.Resource | undefined
	resources: ast.Resource[]
}) => {
	const { referenceLanguage, languages, reference, resources } = args

	const report = createReportFunction(args.rule)
	const { visitors } = await args.rule.setup({ config: { referenceLanguage, languages }, report })

	for (const language of languages) {
		await processResource({
			reference,
			target: getResourceForLanguage(resources, language),
			visitors,
		})
	}
}

// --------------------------------------------------------------------------------------------------------------------

type ProcessNodeFunction<Node> = (args: {
	visitors: Visitors
	reference?: Node
	target?: Node
}) => Promise<void>

// --------------------------------------------------------------------------------------------------------------------

const shouldProcessResourceChildren = (visitors: Visitors) =>
	!!visitors.Message || shouldProcessMessageChildren(visitors)

const processResource: ProcessNodeFunction<ast.Resource> = async ({
	visitors,
	target,
	reference,
}) => {
	const payload = visitors.Resource && (await visitors.Resource({ target: target, reference }))
	if (payload === "skip") {
		return
	}

	// process children
	if (shouldProcessResourceChildren(visitors)) {
		const processedReferenceMessages = new Set<string>()

		for (const targetMessage of target?.body ?? []) {
			const referenceMessage = reference?.body.find(({ id }) => id.name === targetMessage.id.name)

			await processMessage({
				visitors,
				reference: referenceMessage,
				target: targetMessage,
			})

			if (referenceMessage) {
				processedReferenceMessages.add(referenceMessage.id.name)
			}
		}

		const nonVisitedReferenceMessages = reference?.body.filter(
			({ id }) => !processedReferenceMessages.has(id.name),
		)
		for (const referenceNode of nonVisitedReferenceMessages ?? []) {
			await processMessage({
				visitors,
				reference: referenceNode,
				target: undefined,
			})
			processedReferenceMessages.add(referenceNode.id.name)
		}
	}
}

// --------------------------------------------------------------------------------------------------------------------

const shouldProcessMessageChildren = (visitors: Visitors) => !!visitors.Pattern

const processMessage: ProcessNodeFunction<ast.Message> = async ({
	visitors,
	target,
	reference,
}) => {
	const payload = visitors.Message && (await visitors.Message({ target, reference }))
	if (payload === "skip") {
		return
	}

	// process children
	if (shouldProcessMessageChildren(visitors)) {
		await processPattern({
			visitors,
			reference: reference?.pattern,
			target: target?.pattern,
		})
	}
}

// --------------------------------------------------------------------------------------------------------------------

const processPattern: ProcessNodeFunction<ast.Pattern> = async ({
	visitors,
	target,
	reference,
}) => {
	const payload = visitors.Pattern && (await visitors.Pattern({ target, reference }))
	if (payload === "skip") {
		return
	}
}
