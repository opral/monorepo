import { test, expect } from "vitest"
import { Value } from "@sinclair/typebox/value"
import { StorageSchema } from "./storageSchema.js"

/**
 * The risk of additional properties that get removed in a roundtrip is too high.
 */
test("adding messages to the root level should be possible", () => {
	const messages: StorageSchema = {
		hello_world: "property",
		helloWorld: "property",
		HELLO_WORLD: "property",
	}
	expect(Value.Check(StorageSchema, messages)).toBe(true)
})

test("it should be possible to define $schema for typesafety", () => {
	const messages: StorageSchema = {
		$schema: "https://inlang.com/schema/inlang-message-format",
		hello_world: "property",
	}
	expect(Value.Check(StorageSchema, messages)).toBe(true)
})

test("using a hyphen (-) should not be possible to increase compatibility with libraries", () => {
	const messages: StorageSchema = {
		"hello-world": "property",
	}
	expect(Value.Check(StorageSchema, messages)).toBe(false)
})

test("using a dot (.) should not be possible to increase compatibility with libraries", () => {
	const messages: StorageSchema = {
		"hello.world": "property",
	}
	expect(Value.Check(StorageSchema, messages)).toBe(false)
})
