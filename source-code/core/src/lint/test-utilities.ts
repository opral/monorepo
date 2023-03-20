import { lint as lintImplementation, LintRule } from "./index.js"
import type { Message, Resource } from "@inlang/core/ast"
import { vi } from "vitest"

const attachSpiesToVisitor = (visitor: LintRule["visitors"], key: keyof LintRule["visitors"]) => {
	if (!visitor[key]) return

	if (typeof visitor[key] === "function") {
		// @ts-ignore
		visitor[key] = vi.fn(visitor[key] as any)
	} else {
		// @ts-ignore
		if (visitor[key].enter) {
			// @ts-ignore
			visitor[key].enter = vi.fn(visitor[key].enter as any)
		}
		// @ts-ignore
		if (visitor[key].leave) {
			// @ts-ignore
			visitor[key].leave = vi.fn(visitor[key].leave as any)
		}
	}
}

const attachSpies = ({ visitors }: LintRule) => {
	for (const key of ["Resource", "Message", "Pattern"] as const) attachSpiesToVisitor(visitors, key)
}

export const lint = (rule: LintRule, resources: Resource[]) => {
	attachSpies(rule)

	const config = {
		referenceLanguage: resources[0]?.languageTag.name,
		languages: resources.map((resource) => resource.languageTag.name),
		lint: { rules: [rule] },
	}

	return lintImplementation({ config, resources })
}

export const createResource = (language: string, ...messages: Message[]) =>
	({
		type: "Resource",
		languageTag: {
			type: "LanguageTag",
			name: language,
		},
		body: messages,
	} satisfies Resource)

export const createMessage = (id: string, pattern: string) =>
	({
		type: "Message",
		id: { type: "Identifier", name: id },
		pattern: {
			type: "Pattern",
			elements: [{ type: "Text", value: pattern }],
		},
	} satisfies Message)
