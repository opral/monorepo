import { expect, test } from "vitest"
import { getLintReports, lint } from "@inlang/core/lint"

import { initIdenticalPatternRule } from "./identicalPattern.js"
import type { InlangConfig } from "@inlang/core/config"

const config: Pick<InlangConfig, "lint" | "sourceLanguageTag" | "languageTags"> = {
	sourceLanguageTag: "en",
	languageTags: ["en", "de", "fr"],
	lint: { rules: [initIdenticalPatternRule("warn")] },
}

const [lintedResources, errors] = await lint({
	config,
	resources: [
		createResource("en", createMessage("test", "Hello this is english")),
		createResource("de", createMessage("test", "Hallo das is deutsch")),
		createResource("fr", createMessage("test", "Hello this is english")),
	],
})

test("should report if identical message found in another language", async () => {
	const reports = lintedResources.flatMap((resource) => getLintReports(resource))
	expect(reports).toHaveLength(1)
	expect(reports[0]?.message).toBe(
		"Identical message found in language 'fr' with message ID 'test'.",
	)
})

test("it should not throw errors", () => {
	expect(errors).toBeUndefined()
})

test("should not process nodes of the reference language", async () => {
	const referenceResource = lintedResources.find(
		(resource) => resource.languageTag.name === config.sourceLanguageTag,
	)!

	expect(referenceResource.lint).toBeUndefined()
})

// otherwise, a lot of false alert lints happen like
// DE: "Status"
// EN: "Status"
test("only process messages with a pattern that has 3 or more words", async () => {
	const [lintedResources, errors] = await lint({
		config,
		resources: [
			createResource(
				"en",
				createMessage("test1", "Email"),
				createMessage("test2", "Email Status"),
				createMessage("test3", "Gmail Email Status"),
				createMessage("test4", "Your Gmail email status is ..."),
			),
			createResource(
				"de",
				// should NOT lint
				createMessage("test1", "Email"),
				createMessage("test2", "Email Status"),
				// should lint
				createMessage("test3", "Gmail Email Status"),
				createMessage("test4", "Your Gmail email status is ..."),
			),
		],
	})
	expect(errors).toBeUndefined()
	const reports = lintedResources.flatMap((resource) => getLintReports(resource))
	expect(reports).toHaveLength(2)
})
