import { expect, test } from "vitest"
import { lintMessage } from "@inlang/lint"
import { identicalPatternRule } from "./identicalPattern.js"

test("should report if identical message found in another language", async () => {
	// TODO setup
	const l = identicalPatternRule.setup({ options: { ignore: [] } })

	const { data: lintedResources, error: errors } = await lintMessage({})
	expect(errors).toHaveLength(0)
	expect(lintedResources).toHaveLength(1)
	expect(lintedResources[0]!.body.en).toBe("TODO")
})

test("should not report if pattern is present in 'ignore'", async () => {

})
