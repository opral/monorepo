import { expect, test } from "vitest"
import { missingMessage } from "./missingMessage.js"
import { getLintReports, lint } from "@inlang/core/lint"
import { createMessage, createResource } from "../utils.js"

const config = {
	referenceLanguage: "en",
	languages: ["en", "de", "fr"],
	lint: { rules: [missingMessage("error")] },
}

const [lintedResources, errors] = await lint({
	config,
	resources: [
		createResource("en", createMessage("test", "1")),
		createResource("de"),
		createResource("fr", createMessage("test", "1")),
	],
})

test("it should not throw errors", () => {
	expect(errors).toBeUndefined()
})

test("should report if a message is missing", async () => {
	const reports = lintedResources.flatMap((resource) => getLintReports(resource))
	expect(reports).toHaveLength(1)
	expect(reports[0]!.message).toBe("Message with id 'test' is missing for 'de'.")
})

test("should report if a message has an empty pattern", async () => {
	const [lintedResources] = await lint({
		config,
		resources: [
			createResource("en", createMessage("test", "1")),
			createResource("fr", createMessage("test", "1")),
			createResource("de", {
				type: "Message",
				id: { type: "Identifier", name: "test" },
				pattern: { type: "Pattern", elements: [] },
			}),
		],
	})
	const reports = lintedResources.flatMap((resource) => getLintReports(resource))
	expect(reports).toHaveLength(1)
	expect(reports[0]!.message).toBe("Empty pattern (length 0).")
})

test("should report if a message has a pattern with only one text element that is an empty string", async () => {
	const [lintedResources] = await lint({
		config,
		resources: [
			createResource("en", createMessage("test", "1")),
			createResource("fr", createMessage("test", "1")),
			createResource("de", {
				type: "Message",
				id: { type: "Identifier", name: "test" },
				pattern: { type: "Pattern", elements: [{ type: "Text", value: "" }] },
			}),
		],
	})
	const reports = lintedResources.flatMap((resource) => getLintReports(resource))
	expect(reports).toHaveLength(1)
	expect(reports[0]!.message).toBe(
		"The pattern contains only only one element which is an empty string.",
	)
})
