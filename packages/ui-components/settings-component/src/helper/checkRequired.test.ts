import { expect, test } from "vitest"
import checkRequired from "./checkRequired.js"
import { Type } from "@sinclair/typebox"

test("Should detect optional/required for different properties of a schema", () => {
	const propertyA = Type.Optional(Type.String())
	const propertyB = Type.String()
	const schema = Type.Object({
		propertyA,
		propertyB,
	})
	expect(checkRequired(schema, "propertyA")).toBe(false)
	expect(checkRequired(schema, "propertyB")).toBe(true)
})
