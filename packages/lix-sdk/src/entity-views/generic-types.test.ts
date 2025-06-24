/* eslint-disable @typescript-eslint/no-unused-vars */
import { test, expectTypeOf, assertType } from "vitest";
import type {
	LixGenerated,
	LixInsertable,
	LixSelectable,
	LixUpdateable,
	ToKysely,
	EntityView,
	NewState,
} from "./generic-types.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import type { Generated as KyselyGenerated } from "kysely";

test("LixInsertable combined with LixGenerated makes columns optional", () => {
	type MockType = {
		id: LixGenerated<string>;
		name: string;
	};

	// pass (all properties are provided)
	const z: LixInsertable<MockType> = {
		id: "123",
		name: "Test",
	} satisfies LixInsertable<MockType>;

	// pass (LixGenerated makes id optional)
	const a: LixInsertable<MockType> = {
		name: "Test",
	};

	// @ts-expect-error - Name is required in MockType
	const x: LixInsertable<MockType> = {};

	// @ts-expect-error - Name is required in MockType
	const y: LixInsertable<MockType> = {
		id: "123",
	};
});

test("LixSelectable unwraps LixGenerated fields to their base types", () => {
	type MockType = {
		id: LixGenerated<string>;
		name: string;
		count: LixGenerated<number>;
		metadata: { foo: string };
	};

	// All fields should be present and LixGenerated should be unwrapped
	const selected: LixSelectable<MockType> = {
		id: "123",
		name: "Test",
		count: 42,
		metadata: { foo: "bar" },
	} satisfies LixSelectable<MockType>;

	// Type checking - all fields are required
	// @ts-expect-error - All fields are required in selectable
	const missing1: LixSelectable<MockType> = {
		id: "123",
		name: "Test",
		count: 42,
		// missing metadata
	};

	// @ts-expect-error - All fields are required in selectable
	const missing2: LixSelectable<MockType> = {
		// missing id
		name: "Test",
		count: 42,
		metadata: { foo: "bar" },
	};

	// @ts-expect-error - All fields are required in selectable
	const missing3: LixSelectable<MockType> = {
		id: "123",
		// missing name
		count: 42,
		metadata: { foo: "bar" },
	};

	// Verify types are correctly unwrapped
	type IdType = LixSelectable<MockType>["id"]; // Should be string, not LixGenerated<string>
	type CountType = LixSelectable<MockType>["count"]; // Should be number, not LixGenerated<number>

	const idValue: IdType = "test";
	const countValue: CountType = 123;
});

test("LixUpdateable makes all fields optional and unwraps LixGenerated", () => {
	type MockType = {
		id: LixGenerated<string>;
		name: string;
		count: LixGenerated<number>;
		metadata: { foo: string };
		optional?: string;
	};

	// All fields should be optional in updates
	const update1: LixUpdateable<MockType> = {}; // Empty object is valid

	const update2: LixUpdateable<MockType> = {
		id: "new-id",
	};

	const update3: LixUpdateable<MockType> = {
		name: "Updated Name",
	};

	const update4: LixUpdateable<MockType> = {
		count: 100,
	};

	const update5: LixUpdateable<MockType> = {
		metadata: { foo: "updated" },
	};

	const update6: LixUpdateable<MockType> = {
		optional: "now set",
	};

	// Can update multiple fields at once
	const update7: LixUpdateable<MockType> = {
		id: "new-id",
		name: "New Name",
		count: 99,
		metadata: { foo: "baz" },
		optional: "value",
	};

	// Verify that LixGenerated fields are unwrapped
	type UpdateIdType = LixUpdateable<MockType>["id"]; // Should be string | undefined
	type UpdateCountType = LixUpdateable<MockType>["count"]; // Should be number | undefined
	type UpdateNameType = LixUpdateable<MockType>["name"]; // Should be string | undefined

	// These should all work since fields are optional
	const idUpdate: UpdateIdType = undefined;
	const countUpdate: UpdateCountType = undefined;
	const nameUpdate: UpdateNameType = undefined;

	// But when provided, must be correct type
	const wrongType1: LixUpdateable<MockType> = {
		// @ts-expect-error - id must be string when provided
		id: 123,
	};

	const wrongType2: LixUpdateable<MockType> = {
		// @ts-expect-error - count must be number when provided
		count: "not a number",
	};

	const wrongType3: LixUpdateable<MockType> = {
		// @ts-expect-error - metadata must match structure when provided
		metadata: { bar: "wrong key" },
	};
});

test("EntityView transforms schema with x-lix-generated to LixGenerated types", () => {
	// Define a test schema with x-lix-generated properties
	const TestSchema = {
		"x-lix-key": "test_entity",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["id"],
		type: "object",
		properties: {
			id: {
				type: "string",
				"x-lix-generated": true,
			},
			name: {
				type: "string",
			},
		},
		required: ["id", "name"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	type TestEntityView = EntityView<typeof TestSchema>;

	// Test with LixInsertable - generated fields should be optional
	const insertable: LixInsertable<TestEntityView> = {
		// id is optional
		name: "test",
	};

	// Can also provide generated fields
	const insertableWithGenerated: LixInsertable<TestEntityView> = {
		id: "custom-id",
		name: "test",
	};
});

test("Business logic types with LixGenerated markers work with NewState", () => {
	// Define a mock schema with x-lix-generated
	const MockEntitySchema = {
		"x-lix-key": "mock_entity",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["id"],
		type: "object",
		properties: {
			id: { type: "string", "x-lix-generated": true },
			name: { type: "string" },
			count: { type: "number", "x-lix-generated": true },
			optional_field: { type: "string", nullable: true },
		},
		required: ["id", "name", "count"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	// Business logic type with LixGenerated markers
	type MockEntity = EntityView<typeof MockEntitySchema>;

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
