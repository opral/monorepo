import { describe, it, expect } from "vitest"
import { updateServerHooks } from "./addHandleHook"

describe("updateServerHooks", () => {
	it("should add the handle hook if it's not present", () => {
		const code = `export const handleErrorpermalink = () => console.log("damn")`
		const result = updateServerHooks(code)
		expect(result.ok).toBe(true)
		expect(result.updated).toMatchInlineSnapshot(`
			"import { i18n } from '${"$"}lib/i18n'
			import { sequence } from '@sveltejs/kit/hooks'
			export const handleErrorpermalink = () => console.log("damn")

			export const handle = sequence(i18n.handle())"
		`)
	})

	it("should not reimport sequence if it's already imported", () => {
		const code = `import { sequence } from '@sveltejs/kit/hooks'
export const handleErrorpermalink = () => console.log("damn")`
		const result = updateServerHooks(code)
		expect(result.ok).toBe(true)
		expect(result.updated).toMatchInlineSnapshot(`
			"import { i18n } from '${"$"}lib/i18n'
			import { sequence } from '@sveltejs/kit/hooks'
			export const handleErrorpermalink = () => console.log("damn")

			export const handle = sequence(i18n.handle())"
		`)
	})
})
