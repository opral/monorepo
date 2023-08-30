import { it, expect } from "vitest"
import { getTemplate } from "./template.js"

// forgetting a comma here or quotation marks
// is so annoying...
it("should emit valid JSON for the package.json file", () => {
	const template = getTemplate({ type: "plugin" })
	const packageJson = template["./package.json"]
	expect(() => JSON.parse(packageJson)).not.toThrow()
})
