import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { validateSnapshotContent } from "./validate-snapshot-content.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";

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
		validateSnapshotContent({ lix, schema, data: {} })
	).toThrowError();
});

test("inserts the version and active version schemas to enable validation", async () => {
	const lix = await openLixInMemory({});

	const result = await lix.db
		.selectFrom("stored_schema")
		// .where("key", "in", ["lix_version", "lix_active_version"])
		.selectAll()
		.execute();

	console.log(result);
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
		validateSnapshotContent({ lix, schema, snapshot_content: snapshot.content })
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
		validateSnapshotContent({ lix, schema, snapshot_content: snapshot.content })
	).toThrowError();
});
