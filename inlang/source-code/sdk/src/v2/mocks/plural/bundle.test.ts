/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { describe, it, expect } from "vitest"
import { mockBundle } from "./bundle.js"
import { MessageBundle } from "../../types.js"
import { Value } from "@sinclair/typebox/value"

describe("mock plural messageBundle", () => {
	it("is valid", () => {
		const messageBundle: unknown = mockBundle
		expect(Value.Check(MessageBundle, messageBundle)).toBe(true)

		expect(mockBundle.messages.length).toBe(2)
		expect(mockBundle.messages[0]!.declarations.length).toBe(1)
		expect(mockBundle.messages[0]!.selectors.length).toBe(1)
		expect(mockBundle.messages[0]!.variants.length).toBe(3)
	})
})
