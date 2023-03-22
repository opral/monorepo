import { test, expect } from "vitest"
import type { LintedResource } from "./context.js"
import { createReportFunction } from "./report.js"

const message = ""

test("should not throw if no node gets passed", async () => {
	const report = createReportFunction({ id: "rule.id", level: "error" })

	const node = undefined as unknown as LintedResource

	expect(() => report({ node, message })).not.toThrow()

	expect(node).toBeUndefined()
})

test("should create a `lint` property on the node if not present yet", async () => {
	const report = createReportFunction({ id: "rule.id", level: "error" })

	const node = {} as LintedResource

	report({ node, message })

	expect(node.lint).toBeDefined()
	expect(node.lint).toHaveLength(1)
})

test("should attach to the `lint` property on the node if present", async () => {
	const report = createReportFunction({ id: "rule.id", level: "error" })

	const node = { lint: [{}] } as LintedResource
	expect(node.lint).toHaveLength(1)

	report({ node, message })

	expect(node.lint).toHaveLength(2)
})
