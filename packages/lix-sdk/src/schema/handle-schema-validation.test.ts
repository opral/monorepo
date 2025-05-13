import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { handleSchemaValidation } from "./handle-schema-validation.js";
import type { LixSchemaDefinition } from "./definition.js";

test("throws if the schema is not a valid lix schema", async () => {
	const lix = await openLixInMemory({});

	const schema = {
		type: "object",
		"x-lix-version": "1.0",
		properties: {
			name: { type: "string" },
		},
		required: ["name"],
		additionalProperties: false,
		// @ts-expect-error - x-version is missing
	} as const satisfies LixSchemaDefinition;

	expect(() =>
		// @ts-expect-error - x-key is missing
		handleSchemaValidation(lix.sqlite, lix.db as any, schema, {})
	).toThrowError();
});

test("valid lix schema with a valid snapshot passes", async () => {
	const lix = await openLixInMemory({});

	const schema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "mock",
		properties: {
			name: { type: "string" },
		},
		required: ["name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	const snapshot = {
		content: {
			name: "John",
		},
	};

	expect(() =>
		handleSchemaValidation(lix.sqlite, lix.db as any, schema, snapshot.content)
	).not.toThrowError();
});

test("an invalid snapshot fails", async () => {
	const lix = await openLixInMemory({});

	const schema = {
		type: "object",
		"x-lix-version": "1.0",
		"x-lix-key": "mock",
		properties: {
			name: { type: "string" },
		},
		required: ["name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	const snapshot = {
		content: {
			foo: "John",
		},
	};

	expect(() =>
		handleSchemaValidation(lix.sqlite, lix.db as any, schema, snapshot.content)
	).toThrowError();
});
