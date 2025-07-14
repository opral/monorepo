import { test, expect } from "vitest";
import { newLixFile } from "./new-lix.js";
import { openLix } from "./open-lix.js";
import { LixSchemaViewMap } from "../database/schema.js";

test("newLixFile creates a valid lix that can be reopened", async () => {
	// Create a new lix file
	const blob = await newLixFile();
	expect(blob.size).toBeGreaterThan(0);

	// Open the created lix file
	const lix = await openLix({ blob });

	// Try to query the state table to ensure it works
	const result = await lix.db.selectFrom("state_all").selectAll().execute();
	expect(Array.isArray(result)).toBe(true);
});

test("newLixFile creates a global and main version", async () => {
	const blob = await newLixFile();
	const lix = await openLix({ blob });

	// Check that both global and main versions exist
	const versions = await lix.db.selectFrom("version").selectAll().execute();

	expect(versions).toHaveLength(2);

	// Check global version exists
	const globalVersion = versions.find((v) => v.name === "global");
	expect(globalVersion).toBeDefined();
	expect(globalVersion?.inherits_from_version_id).toBeNull();

	// Check main version exists
	const mainVersion = versions.find((v) => v.name === "main");
	expect(mainVersion).toBeDefined();
	expect(mainVersion?.inherits_from_version_id).toBe("global");
});

test("newLixFile creates required bootstrap change sets", async () => {
	const blob = await newLixFile();
	const lix = await openLix({ blob });

	// Check that change sets exist (should be 4: 2 for global, 2 for main)
	const changeSets = await lix.db
		.selectFrom("change_set")
		.selectAll()
		.execute();

	expect(changeSets).toHaveLength(4);
});

test("newLixFile creates checkpoint label", async () => {
	const blob = await newLixFile();
	const lix = await openLix({ blob });

	// Check that checkpoint label exists
	const labels = await lix.db.selectFrom("label").selectAll().execute();

	expect(labels).toHaveLength(1);
	expect(labels[0]?.name).toBe("checkpoint");
});

test("newLixFile creates all schema definitions", async () => {
	const blob = await newLixFile();
	const lix = await openLix({ blob });

	// Check that all schemas from LixSchemaViewMap are created
	const storedSchemas = await lix.db
		.selectFrom("stored_schema")
		.selectAll()
		.execute();

	const expectedSchemaCount = Object.keys(LixSchemaViewMap).length;
	expect(storedSchemas).toHaveLength(expectedSchemaCount);

	// Check that each schema from LixSchemaViewMap exists
	for (const schema of Object.values(LixSchemaViewMap)) {
		const storedSchema = storedSchemas.find(
			(s) => s.key === schema["x-lix-key"]
		);
		expect(storedSchema).toBeDefined();
		expect(storedSchema?.version).toBe(schema["x-lix-version"]);
		expect(storedSchema?.lixcol_inherited_from_version_id).toBe("global");

		// Verify the stored value is valid JSON and matches the schema
		expect(storedSchema?.value["x-lix-key"]).toBe(schema["x-lix-key"]);
		expect(storedSchema?.value["x-lix-version"]).toBe(schema["x-lix-version"]);
	}
});

test("newLixFile creates change set elements for all changes", async () => {
	const blob = await newLixFile();
	const lix = await openLix({ blob });

	// Check that change set elements exist
	const changeSetElements = await lix.db
		.selectFrom("change_set_element")
		.selectAll()
		.execute();

	// Should have change set elements for all bootstrap changes
	expect(changeSetElements.length).toBeGreaterThan(0);
});

test("bootstrap changes include lix_id key-value in global version", async () => {
	const blob = await newLixFile();
	const lix = await openLix({ blob });

	const kv = await lix.db
		.selectFrom("key_value_all")
		.where("key", "=", "lix_id")
		.where("lixcol_version_id", "=", "global")
		.selectAll()
		.execute();

	expect(kv).toHaveLength(1);
	expect(kv[0]?.key).toBe("lix_id");
	expect(kv[0]?.value).toBeDefined();
});

test("bootstrap changes include lix_name key-value in the global version", async () => {
	const blob = await newLixFile();
	const lix = await openLix({ blob });

	const kv = await lix.db
		.selectFrom("key_value_all")
		.where("key", "=", "lix_name")
		.where("lixcol_version_id", "=", "global")
		.selectAll()
		.execute();

	expect(kv).toHaveLength(1);
	expect(kv[0]?.key).toBe("lix_name");
	expect(kv[0]?.value).toBeDefined();
});

test("newLixFile returns blob with ._lix.id property", async () => {
	const blob = await newLixFile();

	// Check that ._lix.id is accessible directly on the blob
	expect(blob._lix).toBeDefined();
	expect(blob._lix.id).toBeDefined();
	expect(typeof blob._lix.id).toBe("string");
	expect(blob._lix.id.length).toBeGreaterThan(0);

	// Verify the ._lix.id matches the one stored in the database
	const lix = await openLix({ blob });
	const kv = await lix.db
		.selectFrom("key_value_all")
		.where("key", "=", "lix_id")
		.where("lixcol_version_id", "=", "global")
		.selectAll()
		.execute();

	expect(kv).toHaveLength(1);
	expect(blob._lix.id).toBe(kv[0]?.value);
});

test("newLixFile returns blob with ._lix.name property", async () => {
	const blob = await newLixFile({});

	// Check that ._lix.name is accessible directly on the blob
	expect(blob._lix).toBeDefined();
	expect(blob._lix.name).toBeDefined();
	expect(typeof blob._lix.name).toBe("string");
	expect(blob._lix.name.length).toBeGreaterThan(0);

	// Verify the ._lix.name matches the one stored in the database
	const lix = await openLix({ blob });
	const kv = await lix.db
		.selectFrom("key_value_all")
		.where("key", "=", "lix_name")
		.where("lixcol_version_id", "=", "global")
		.selectAll()
		.execute();

	expect(kv).toHaveLength(1);
	expect(blob._lix.name).toBe(kv[0]?.value);
});

test("newLixFile can use provided key values", async () => {
	const blob = await newLixFile({
		keyValues: [
			{ key: "lix_name", value: "Test Lix Name", lixcol_version_id: "global" },
			{ key: "lix_id", value: "test-lix-id", lixcol_version_id: "global" },
			{ key: "custom_key", value: "custom_value", lixcol_version_id: "global" },
		],
	});

	// Check the `_lix` property on the blob
	expect(blob._lix.name).toBe("Test Lix Name");
	expect(blob._lix.id).toBe("test-lix-id");

	// Check the values in the database
	const lix = await openLix({ blob });
	const nameKv = await lix.db
		.selectFrom("key_value_all")
		.where("key", "=", "lix_name")
		.selectAll()
		.executeTakeFirst();
	expect(nameKv?.value).toBe("Test Lix Name");

	const idKv = await lix.db
		.selectFrom("key_value_all")
		.where("key", "=", "lix_id")
		.selectAll()
		.executeTakeFirst();
	expect(idKv?.value).toBe("test-lix-id");

	const customKv = await lix.db
		.selectFrom("key_value_all")
		.where("key", "=", "custom_key")
		.selectAll()
		.executeTakeFirst();
	expect(customKv?.value).toBe("custom_value");
	expect(customKv?.lixcol_version_id).toBe("global");
});

test("provided key values default to the active version if lixcol_version_id is not specified", async () => {
	const blob = await newLixFile({
		keyValues: [
			{ key: "test_key_1", value: "test_value_1" },
			{ key: "test_key_2", value: "test_value_2" },
		],
	});

	const lix = await openLix({ blob });

	// Get the active version
	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirst();

	expect(activeVersion).toBeDefined();
	expect(activeVersion?.version_id).toBeDefined();

	// Check that the key values are associated with the active version
	const kv1 = await lix.db
		.selectFrom("key_value_all")
		.where("key", "=", "test_key_1")
		.selectAll()
		.executeTakeFirst();

	expect(kv1?.value).toBe("test_value_1");
	expect(kv1?.lixcol_version_id).toBe(activeVersion?.version_id);

	const kv2 = await lix.db
		.selectFrom("key_value_all")
		.where("key", "=", "test_key_2")
		.selectAll()
		.executeTakeFirst();

	expect(kv2?.value).toBe("test_value_2");
	expect(kv2?.lixcol_version_id).toBe(activeVersion?.version_id);

	// The active version should be "main" (not "global")
	const mainVersion = await lix.db
		.selectFrom("version")
		.where("id", "=", activeVersion!.version_id)
		.selectAll()
		.executeTakeFirst();

	expect(mainVersion?.name).toBe("main");
});
