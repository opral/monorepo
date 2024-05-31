import { updateAppDTsFile } from "./updateAppTypes"
import { describe, it, expect } from "vitest"

describe("updateAppDTsFile", () => {
	it("updates the default dts file", () => {
		const file = `// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}
}

export {}`

		const result = updateAppDTsFile(file)
		expect(result.ok).toBe(true)
		expect(result.updated).toMatchInlineSnapshot(`
			"import type { AvailableLanguageTag } from \\"$lib/paraglide/runtime\\"
			import type { ParaglideLocals } from \\"@inlang/paraglide-sveltekit\\"
			// See https://kit.svelte.dev/docs/types#app
			// for information about these interfaces
			declare global {
				namespace App {
					// interface Error {}
					 interface Locals {
			    paraglide: ParaglideLocals<AvailableLanguageTag>,
			}
					// interface PageData {}
					// interface Platform {}
				}
			}

			export {}"
		`)
	})
})
