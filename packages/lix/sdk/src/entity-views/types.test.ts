/* eslint-disable @typescript-eslint/no-unused-vars */
import { test } from "vitest";
import type { ToKysely, NewState } from "./types.js";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
	LixGenerated,
	LixInsertable,
	LixSelectable,
	LixUpdateable,
} from "../schema-definition/definition.js";
import type { Generated as KyselyGenerated } from "kysely";

test("ToKysely converts LixGenerated to Kysely Generated", () => {
	type MockType = {
		id: LixGenerated<string>;
		name: string;
		count: LixGenerated<number>;
		metadata: { foo: string };
		optional?: string | null;
	};

	// The conversion should map LixGenerated to KyselyGenerated
	type KyselyVersion = ToKysely<MockType>;

	// Verify the conversion is correct by creating a type-compatible object
	const kyselyTable: KyselyVersion = {
		id: {} as KyselyGenerated<string>,
		name: "test",
		count: {} as KyselyGenerated<number>,
		metadata: { foo: "bar" },
		optional: null,
	};

	// Type checks - verify specific field types
	type IdType = KyselyVersion["id"]; // Should be KyselyGenerated<string>
	type NameType = KyselyVersion["name"]; // Should be string
	type CountType = KyselyVersion["count"]; // Should be KyselyGenerated<number>
	type MetadataType = KyselyVersion["metadata"]; // Should be { foo: string }
	type OptionalType = KyselyVersion["optional"]; // Should be string | null | undefined

	// These should work
	const id: IdType = {} as KyselyGenerated<string>;
	const name: NameType = "test";
	const count: CountType = {} as KyselyGenerated<number>;
	const metadata: MetadataType = { foo: "test" };
	const optional1: OptionalType = "value";
	const optional2: OptionalType = null;
	const optional3: OptionalType = undefined;
});

test("LixDefault markers work with NewState", () => {
	// Define a mock schema with x-lix-default
	const MockEntitySchema = {
		"x-lix-key": "mock_entity",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		type: "object",
		properties: {
			id: { type: "string", "x-lix-default": "lix_nano_id()" },
			name: { type: "string" },
			count: { type: "number", "x-lix-default": "0" },
			optional_field: { type: "string", nullable: true },
		},
		required: ["id", "name", "count"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Business logic type with LixGenerated markers
	type MockEntity = FromLixSchemaDefinition<typeof MockEntitySchema>;

	// Test that NewState makes generated fields optional
	const newMockEntity: NewState<MockEntity> = {
		name: "test-name",
		// id should be optional because it's LixGenerated
		// count should be optional because it's LixGenerated
		// optional_field should be optional because it's nullable
	};

	// Test that NewState also accepts generated fields when provided
	const newMockEntityWithGenerated: NewState<MockEntity> = {
		id: "custom-id",
		name: "test-name",
		count: 42,
		optional_field: "optional",
	};

	// Test that required non-generated fields are still required
	// @ts-expect-error - name is required
	const invalidNewMockEntity: NewState<MockEntity> = {
		count: 42,
		// Missing required field 'name'
	};

	// Verify the types work as expected
	void newMockEntity;
	void newMockEntityWithGenerated;
	void invalidNewMockEntity;
});
