import { test, expect } from "vitest";
import { Value } from "@sinclair/typebox/value";
import { FileSchema } from "./fileSchema.js";

/**
 * The risk of additional properties that get removed in a roundtrip is too high.
 */
test("adding messages to the root level should be possible", () => {
	const messages: FileSchema = {
		hello_world: "property",
		helloWorld: "property",
		HELLO_WORLD: "property",
	};
	expect(Value.Check(FileSchema, messages)).toBe(true);
});

test("it should be possible to define $schema for typesafety", () => {
	const messages: FileSchema = {
		$schema: "https://inlang.com/schema/inlang-message-format",
		hello_world: "property",
	};
	expect(Value.Check(FileSchema, messages)).toBe(true);
});

// #2325 - types have been loosened to allow for new/unknown properties
test("using a hyphen (-) should not be possible to increase compatibility with libraries", () => {
	const messages: FileSchema = {
		"hello-world": "property",
	};
	expect(Value.Check(FileSchema, messages)).toBe(false);
});

// #2325 - types have been loosened to allow for new/unknown properties
test("using a dot (.) should not be possible to increase compatibility with libraries", () => {
	const messages: FileSchema = {
		"hello.world": "property",
	};
	expect(Value.Check(FileSchema, messages)).toBe(false);
});

test("variant declarations and selectors are optional ", async () => {
	const messages: FileSchema = {
		jojo_mountain_day: {
			match: {
				"platform=android, userGender=male":
					"{username} has to download the app on his phone from the Google Play Store.",
				"platform=ios, userGender=female":
					"{username} has to download the app on her iPhone from the App Store.",
				"platform=*, userGender=*": "The person has to download the app.",
			},
		},
	};
	expect(Value.Check(FileSchema, messages)).toBe(true);
});

test("variant declarations and selectors can be defined ", async () => {
	const messages: FileSchema = {
		some_happy_cat: {
			declarations: ["input count", "local countPlural = count: plural"],
			selectors: ["countPlural"],
			match: {
				"countPlural=one": "There is one cat.",
				"countPlural=other": "There are many cats.",
			},
		},
	};
	expect(Value.Check(FileSchema, messages)).toBe(true);
});