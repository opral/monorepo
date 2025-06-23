/* eslint-disable @typescript-eslint/no-unused-vars */
import { test, expectTypeOf, assertType } from "vitest";
import type {
	LixGenerated,
	LixInsertable,
	LixSelectable,
	LixUpdateable,
	ToKysely,
} from "./generic-types.js";
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

	// Test with nested LixGenerated
	type NestedMockType = {
		id: LixGenerated<string>;
		data: {
			created: LixGenerated<Date>;
			value: number;
			nested: {
				generated: LixGenerated<boolean>;
				normal: string;
			};
		};
		regular: string[];
	};

	type NestedKysely = ToKysely<NestedMockType>;

	// Verify nested conversion
	const nestedKysely: NestedKysely = {
		id: {} as KyselyGenerated<string>,
		data: {
			created: {} as KyselyGenerated<Date>,
			value: 42,
			nested: {
				generated: {} as KyselyGenerated<boolean>,
				normal: "test",
			},
		},
		regular: ["a", "b", "c"],
	};

	// Type checks for nested
	type NestedCreatedType = NestedKysely["data"]["created"]; // Should be KyselyGenerated<Date>
	type NestedGeneratedType = NestedKysely["data"]["nested"]["generated"]; // Should be KyselyGenerated<boolean>
	type NestedNormalType = NestedKysely["data"]["nested"]["normal"]; // Should be string
	
	const nestedCreated: NestedCreatedType = {} as KyselyGenerated<Date>;
	const nestedGenerated: NestedGeneratedType = {} as KyselyGenerated<boolean>;
	const nestedNormal: NestedNormalType = "string";
});

test("Composing entity types with StateEntityColumns and using ToKysely", () => {
	// Mock entity type (like LixKeyValue)
	type MockEntity = {
		key: string;
		value: any;
	};

	// Import the actual StateEntityColumns type for this test
	type StateEntityColumns = {
		lixcol_file_id: LixGenerated<string>;
		lixcol_inherited_from_version_id: LixGenerated<string | null>;
		lixcol_created_at: LixGenerated<string>;
		lixcol_updated_at: LixGenerated<string>;
	};

	// Compose the entity with view columns
	type EntityWithViewColumns = MockEntity & StateEntityColumns;

	// Test LixInsertable with composed type
	const insertable: LixInsertable<EntityWithViewColumns> = {
		key: "test-key",
		value: { foo: "bar" },
		// lixcol fields are optional in inserts
	};

	// Can also provide lixcol fields if needed
	const insertableWithLixcol: LixInsertable<EntityWithViewColumns> = {
		key: "test-key",
		value: 123,
		lixcol_file_id: "custom-file",
		lixcol_created_at: "2024-01-01",
	};

	// Test LixSelectable with composed type - all fields required and unwrapped
	const selectable: LixSelectable<EntityWithViewColumns> = {
		key: "test-key",
		value: [1, 2, 3],
		lixcol_file_id: "lix",
		lixcol_inherited_from_version_id: null,
		lixcol_created_at: "2024-01-01",
		lixcol_updated_at: "2024-01-01",
	};

	// Test ToKysely conversion for database operations
	type KyselyEntityView = ToKysely<EntityWithViewColumns>;
	
	// This is what Kysely would expect at the database boundary
	const kyselyView: KyselyEntityView = {
		key: "test-key",
		value: "json-string",
		lixcol_file_id: {} as KyselyGenerated<string>,
		lixcol_inherited_from_version_id: {} as KyselyGenerated<string | null>,
		lixcol_created_at: {} as KyselyGenerated<string>,
		lixcol_updated_at: {} as KyselyGenerated<string>,
	};

	// Verify types are correctly mapped
	type FileIdType = KyselyEntityView["lixcol_file_id"]; // Should be KyselyGenerated<string>
	type InheritedType = KyselyEntityView["lixcol_inherited_from_version_id"]; // Should be KyselyGenerated<string | null>
	
	const fileId: FileIdType = {} as KyselyGenerated<string>;
	const inherited: InheritedType = {} as KyselyGenerated<string | null>;
});
