/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { describe, it, expect } from "vitest"
import { bundle } from "./bundle.js"
import { MessageBundle } from "../../types.js"
import { Value } from "@sinclair/typebox/value"

describe("mock plural messageBundle", () => {
	it("is valid", () => {
		const messageBundle: unknown = bundle
		expect(Value.Check(MessageBundle, messageBundle)).toBe(true)

		expect(bundle.messages.length).toBe(2)
		expect(bundle.messages[0]!.declarations.length).toBe(1)
		expect(bundle.messages[0]!.selectors.length).toBe(1)
		expect(bundle.messages[0]!.variants.length).toBe(3)
	})
})
