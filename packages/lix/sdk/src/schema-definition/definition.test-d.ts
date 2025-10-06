/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
	LixGenerated,
	LixInsertable,
	LixSelectable,
	LixUpdateable,
} from "./definition.js";
import { test, assertType } from "vitest";

test("a json change schema should be infer the properties", () => {
	const jsonChangeSchema = {
		"x-lix-version": "1.0",
		"x-lix-key": "mock",
		type: "object",
		properties: {
			name: { type: "string" },
			age: { type: "number" },
			location: { type: "object" },
		},
		required: ["name", "age", "location"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	const snapshot: FromLixSchemaDefinition<typeof jsonChangeSchema> = {
		name: "John",
		age: 5,
		location: {
			city: "New York",
			country: "USA",
		},
	};

	assertType<{
		name: string;
		age: number;
		location: {
			[x: string]: unknown;
		};
	}>(snapshot);
});

test("x-lix-defaults typing", () => {
	const schema = {
		"x-lix-key": "defaults",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			id: { type: "string" },
		},
		required: ["id"],
		additionalProperties: false,
		"x-lix-defaults": {
			lixcol_file_id: "lix",
			attempts: 3,
		},
	} as const satisfies LixSchemaDefinition;

	assertType<Record<string, string | number | boolean | null> | undefined>(
		schema["x-lix-defaults"]
	);
});

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

test("FromLixSchemaDefinition transforms schema with x-lix-generated to LixGenerated types", () => {
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

	type TestEntity = FromLixSchemaDefinition<typeof TestSchema>;

	// Test with LixInsertable - generated fields should be optional
	const insertable: LixInsertable<TestEntity> = {
		// id is optional
		name: "test",
	};

	// Can also provide generated fields
	const insertableWithGenerated: LixInsertable<TestEntity> = {
		id: "custom-id",
		name: "test",
	};
});

test("FromLixSchemaDefinition transforms empty object types to Record<string, any>", () => {
	const TestSchema = {
		"x-lix-key": "test_entity",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["id"],
		"x-lix-immutable": true,
		type: "object",
		properties: {
			id: { type: "string" },
			payload: { type: "object" },
			config: { type: "object", nullable: true },
		},
		required: ["id", "payload"],
		additionalProperties: false,
	} as const satisfies LixSchemaDefinition;

	type TestEntity = FromLixSchemaDefinition<typeof TestSchema>;

	// Test that payload is Record<string, any>
	const entity: TestEntity = {
		id: "test",
		payload: {
			author: "test-user",
			created_at: new Date().toISOString(),
			nested: { deep: { value: 123 } },
		},
		config: null,
	};

	// Verify types
	assertType<Record<string, any>>(entity.payload);
	assertType<Record<string, any> | null | undefined>(entity.config);
});
