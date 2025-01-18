import { describe, expect, it } from "vitest"
import { updateLayoutFile } from "./addParaglideJSComponent"

describe("updateLayoutFile", () => {
	it("should update an empty layout file", () => {
		expect(updateLayoutFile("")).toMatchInlineSnapshot(`
			"<script>
				import { ParaglideJS } from '@inlang/paraglide-sveltekit'
				import { i18n } from '$lib/i18n'
			</script>
			<ParaglideJS {i18n}>


			<slot/>
			</ParaglideJS>"
		`)
	})

	it("should update a layout file with just a slot", () => {
		expect(updateLayoutFile("<slot/>")).toMatchInlineSnapshot(`
			"<script>
				import { ParaglideJS } from '@inlang/paraglide-sveltekit'
				import { i18n } from '$lib/i18n'
			</script>
			<ParaglideJS {i18n}>

			<slot/>
			</ParaglideJS>"
		`)
	})

	it("should update a layout file with a script", () => {
		expect(updateLayoutFile(`<script>const a = 5;</script>`)).toMatchInlineSnapshot(`
			"<script>
				import { ParaglideJS } from '@inlang/paraglide-sveltekit'
				import { i18n } from '$lib/i18n'
			const a = 5;</script>
			<ParaglideJS {i18n}>

			<slot/>
			</ParaglideJS>"
		`)
	})

	it("should update a layout file with just a style", () => {
		expect(updateLayoutFile(`<style>a { color: inherit; }</style>`)).toMatchInlineSnapshot(`
			"<script>
				import { ParaglideJS } from '@inlang/paraglide-sveltekit'
				import { i18n } from '$lib/i18n'
			</script>
			<ParaglideJS {i18n}>


			<slot/>
			</ParaglideJS><style>a { color: inherit; }</style>"
		`)
	})

	it("should update a layout file that already contains a slot", () => {
		const code = `<p>
    <slot/> 
</p>
        `

		expect(updateLayoutFile(code)).toMatchInlineSnapshot(`
				"<script>
					import { ParaglideJS } from '@inlang/paraglide-sveltekit'
					import { i18n } from '$lib/i18n'
				</script>
				<ParaglideJS {i18n}>

				<p>
				    <slot/> 
				</p>
				        
				</ParaglideJS>"
			`)
	})

	it("should upate a typescript script", () => {
		const code = `
        <script lang="ts">
            const a : number = 5;
        </script>
        
        <p><slot/></p>
        `

		expect(updateLayoutFile(code)).toMatchInlineSnapshot(`
				"
				        <script lang="ts">
					import { ParaglideJS } from '@inlang/paraglide-sveltekit'
					import { i18n } from '$lib/i18n'

				            const a : number = 5;
				        </script>
				<ParaglideJS {i18n}>

				        
				        <p><slot/></p>
				        
				</ParaglideJS>"
			`)
	})
})
