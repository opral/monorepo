import { test, expect } from "vitest"
import { Value } from "@sinclair/typebox/value"
import { FileSchema } from "./fileSchema.js"

/**
 * The risk of additional properties that get removed in a roundtrip is too high.
 */
test("adding messages to the root level should be possible", () => {
	const messages: FileSchema = {
		hello_world: "property",
		helloWorld: "property",
		HELLO_WORLD: "property",
	}
	expect(Value.Check(FileSchema, messages)).toBe(true)
})

test("it should be possible to define $schema for typesafety", () => {
	const messages: FileSchema = {
		$schema: "https://inlang.com/schema/inlang-message-format",
		hello_world: "property",
	}
	expect(Value.Check(FileSchema, messages)).toBe(true)
})

// #2325 - types have been loosened to allow for new/unknown properties
test("using a hyphen (-) should not be possible to increase compatibility with libraries", () => {
	const messages: FileSchema = {
		"hello-world": "property",
	}
	expect(Value.Check(FileSchema, messages)).toBe(false)
})

// #2325 - types have been loosened to allow for new/unknown properties
test("using a dot (.) should not be possible to increase compatibility with libraries", () => {
	const messages: FileSchema = {
		"hello.world": "property",
	}
	expect(Value.Check(FileSchema, messages)).toBe(false)
})
