import { it, expect } from "vitest"
import { shouldApply } from "./precheck"
import ParaglideJSComponentCode from "../../runtime/ParaglideJS.svelte?raw"

it("should not apply on the ParaglideJS component", () => {
	expect(
		shouldApply(ParaglideJSComponentCode, {
			a: [
				{
					attribute_name: "href",
				},
			],
		})
	).toBe(false)
})

it("should apply on a component with <svelte:element>", () => {
	const code = `
	<p>
	<svelte:element this="a" href="/test" hreflang="de" >content</svelte:element>
	</p>
	`

	expect(
		shouldApply(code, {
			a: [
				{
					attribute_name: "href",
				},
			],
		})
	).toBe(true)
})

it("should apply on a component with <svelte:element> and spread operator", () => {
	const code = `
	<p>
	<svelte:element {...props} >content</svelte:element>
	</p>
	`

	expect(
		shouldApply(code, {
			a: [
				{
					attribute_name: "href",
				},
			],
		})
	).toBe(true)
})

it("should apply on a component that matches the translation", () => {
	const code = `
	<p>
	<a href="/test" hreflang="de" >content</a>
	</p>
	`

	expect(
		shouldApply(code, {
			a: [
				{
					attribute_name: "href",
				},
			],
		})
	).toBe(true)
})
