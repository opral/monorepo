import { it, expect } from "vitest"
import { compileBundle } from "./compileBundle.js"
import { createBundle, createMessage } from "@inlang/sdk2"

it("should compile a bundle", () => {
	const bundleId = "my_bundle"
	const bundle = createBundle({
		id: bundleId,
		messages: [
			createMessage({
				bundleId,
				locale: "en",
				text: "Hello World!",
			}),
			createMessage({
				bundleId,
				locale: "de",
				text: "Hallo Welt!",
			}),
		],
	})

	const output = compileBundle(bundle, {
		en: undefined,
		de: "en",
	})
	expect(output).toMatchInlineSnapshot()
})
