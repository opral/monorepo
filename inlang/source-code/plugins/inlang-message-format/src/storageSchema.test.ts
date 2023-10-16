import { test, expect } from "vitest"
import { Value } from "@sinclair/typebox/value"
import { StorageSchema } from "./storageSchema.js"

/**
 * The risk of additional properties that get removed in a roundtrip is too high.
 */
test("it should not be possible to create a storage schema with additional properties", () => {
	const messages: StorageSchema = {
		data: [],
		// @ts-expect-error - this should not be possible
		additional: "property",
	}
	expect(Value.Check(StorageSchema, messages)).toBe(false)
})

test("it should be possible to define $schema for typesafety", () => {
	const messages: StorageSchema = {
		$schema: "https://inlang.com/schema/inlang-message-format",
		data: [],
	}
	expect(Value.Check(StorageSchema, messages)).toBe(true)
})
