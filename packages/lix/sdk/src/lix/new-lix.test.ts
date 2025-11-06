import { test, expect } from "vitest";
import { newLixFile } from "./new-lix.js";
import { openLix } from "./open-lix.js";
import { LixSchemaViewMap } from "../database/schema-view-map.js";
import { LixVersionDescriptorSchema } from "../version/schema-definition.js";

test("newLixFile creates a valid lix that can be reopened", async () => {
	// Create a new lix file
	const blob = await newLixFile();
	expect(blob.size).toBeGreaterThan(0);

	// Open the created lix file
	const lix = await openLix({ blob });

	// Try to query the state table to ensure it works
	const result = await lix.db
		.selectFrom("state_by_version")
		.selectAll()
		.execute();
	expect(Array.isArray(result)).toBe(true);
});

test("newLixFile creates a global and main version", async () => {
	const blob = await newLixFile({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});
	const lix = await openLix({ blob });

	// Check that both global and main versions exist
	const versions = await lix.db
		.selectFrom("version")
		.orderBy("name")
		.selectAll()
		.execute();

	expect(versions).toHaveLength(2);

	// Check global version exists
	const globalVersion = versions.find((v) => v.name === "global");
	expect(globalVersion).toBeDefined();
	expect(globalVersion?.inherits_from_version_id).toBeNull();

	// Check main version exists
	const mainVersion = versions.find((v) => v.name === "main");
	expect(mainVersion).toBeDefined();
	expect(mainVersion?.inherits_from_version_id).toBe("global");

	const descriptors = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", LixVersionDescriptorSchema["x-lix-key"])
		.selectAll()
		.execute();

	const globalDescriptor = descriptors.find(
		(d) => d.snapshot_content.name === "global"
	);
	expect(globalDescriptor).toBeDefined();

	const mainDescriptor = descriptors.find(
		(d) => d.snapshot_content.name === "main"
	);
	expect(mainDescriptor).toBeDefined();
});

test("newLixFile creates required bootstrap change sets", async () => {
	const blob = await newLixFile();
	const lix = await openLix({ blob });

	// Check that change sets exist (should be 4: 2 for global, 2 for main)
	const changeSets = await lix.db
		.selectFrom("change_set_by_version")
		.where("lixcol_version_id", "in", ["global", "main"])
		.orderBy("lixcol_version_id")
		.selectAll()
		.execute();

	expect(changeSets).toHaveLength(4);
});

test("newLixFile creates checkpoint label", async () => {
	const blob = await newLixFile();
	const lix = await openLix({ blob });

	// Check that checkpoint label exists
	const labels = await lix.db
		.selectFrom("label")
		.where("name", "=", "checkpoint")
		.selectAll()
		.execute();

	expect(labels).toHaveLength(1);
	expect(labels[0]?.name).toBe("checkpoint");
});

test("newLixFile creates all schema definitions", async () => {
	const blob = await newLixFile();
	const lix = await openLix({ blob });

	// Check that all schemas from LixSchemaViewMap are created
	const storedSchemas = await lix.db
		.selectFrom("stored_schema")
		.select(["value", "lixcol_inherited_from_version_id"])
		.execute();

	const expectedSchemaCount = Object.keys(LixSchemaViewMap).length;
	expect(storedSchemas).toHaveLength(expectedSchemaCount + 3); // +3 for lix_active_account, lix_active_version, lix_change

	// Check that each schema from LixSchemaViewMap exists
	for (const schema of Object.values(LixSchemaViewMap)) {
		const storedSchema = storedSchemas.find(
			(row) => row.value["x-lix-key"] === schema["x-lix-key"]
		);
		expect(storedSchema).toBeDefined();
		expect(storedSchema?.value["x-lix-version"]).toBe(schema["x-lix-version"]);
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
		.selectFrom("change_set_element_by_version")
		.where("lixcol_version_id", "in", ["global", "main"])
		.orderBy("lixcol_version_id")
		.selectAll()
		.execute();

	// Should have change set elements for all bootstrap changes
	expect(changeSetElements.length).toBeGreaterThan(0);
});

test("bootstrap changes include lix_id key-value in global version", async () => {
	const blob = await newLixFile();
	const lix = await openLix({ blob });

	const kv = await lix.db
		.selectFrom("key_value_by_version")
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
		.selectFrom("key_value_by_version")
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
		.selectFrom("key_value_by_version")
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
		.selectFrom("key_value_by_version")
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
		.selectFrom("key_value_by_version")
		.where("key", "=", "lix_name")
		.where("lixcol_version_id", "=", "global")
		.selectAll()
		.executeTakeFirst();
	expect(nameKv?.value).toBe("Test Lix Name");

	const idKv = await lix.db
		.selectFrom("key_value_by_version")
		.where("key", "=", "lix_id")
		.where("lixcol_version_id", "=", "global")
		.selectAll()
		.executeTakeFirst();
	expect(idKv?.value).toBe("test-lix-id");

	const customKv = await lix.db
		.selectFrom("key_value_by_version")
		.where("key", "=", "custom_key")
		.where("lixcol_version_id", "=", "global")
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
		.orderBy("version_id")
		.executeTakeFirst();

	expect(activeVersion).toBeDefined();
	expect(activeVersion?.version_id).toBeDefined();

	// Check that the key values are associated with the active version
	const kv1 = await lix.db
		.selectFrom("key_value_by_version")
		.where("key", "=", "test_key_1")
		.where("lixcol_version_id", "=", activeVersion!.version_id)
		.selectAll()
		.executeTakeFirst();

	expect(kv1?.value).toBe("test_value_1");
	expect(kv1?.lixcol_version_id).toBe(activeVersion?.version_id);

	const kv2 = await lix.db
		.selectFrom("key_value_by_version")
		.where("key", "=", "test_key_2")
		.where("lixcol_version_id", "=", activeVersion!.version_id)
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

test("deterministic mode with randomLixId: true results in different lix_ids", async () => {
	// Create two lix files with deterministic mode but randomLixId: true
	const blob1 = await newLixFile({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, randomLixId: true },
			},
		],
	});
	const blob2 = await newLixFile({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, randomLixId: true },
			},
		],
	});

	// The lix_ids should be different when randomLixId is true
	expect(blob1._lix.id).toBeDefined();
	expect(blob2._lix.id).toBeDefined();
	expect(blob1._lix.id).not.toBe(blob2._lix.id);
});

test("deterministic mode results in identical lix_ids", async () => {
	// Create two lix files with deterministic mode enabled
	const blob1 = await newLixFile({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
			},
		],
	});
	const blob2 = await newLixFile({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
			},
		],
	});

	// The lix_ids should be identical (deterministic-lix-id)
	expect(blob1._lix.id).toBeDefined();
	expect(blob2._lix.id).toBeDefined();
	expect(blob1._lix.id).toBe(blob2._lix.id);
	expect(blob1._lix.id).toBe("deterministic-lix-id");
});

test("deterministic mode creates fully deterministic lix", async () => {
	// Create two lix files with deterministic mode enabled
	const blob1 = await newLixFile({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
			},
		],
	});
	const blob2 = await newLixFile({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
			},
		],
	});

	const lix1 = await openLix({ blob: blob1 });
	const lix2 = await openLix({ blob: blob2 });

	// Check that all changes have identical IDs and timestamps
	const changes1 = await lix1.db
		.selectFrom("change")
		.select(["id", "entity_id", "created_at"])
		.orderBy("id")
		.execute();
	const changes2 = await lix2.db
		.selectFrom("change")
		.select(["id", "entity_id", "created_at"])
		.orderBy("id")
		.execute();

	expect(changes1).toEqual(changes2);

	// Check that all entity IDs are identical
	const versions1 = await lix1.db
		.selectFrom("version")
		.select(["id", "name"])
		.orderBy("id")
		.execute();
	const versions2 = await lix2.db
		.selectFrom("version")
		.select(["id", "name"])
		.orderBy("id")
		.execute();

	expect(versions1).toEqual(versions2);

	// Check timestamps are deterministic (epoch 0)
	expect(changes1[0]?.created_at).toBe("1970-01-01T00:00:00.000Z");
});

test("deterministic mode config is persisted correctly", async () => {
	const blob = await newLixFile({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, randomLixId: false },
			},
		],
	});
	const lix = await openLix({ blob });

	// Check that lix_deterministic_mode exists in key_value_by_version
	// Since no lixcol_version_id was specified, it should be in the main version
	const result = await lix.db
		.selectFrom("key_value_by_version")
		.where("key", "=", "lix_deterministic_mode")
		.select(["key", "value", "lixcol_version_id"])
		.executeTakeFirst();

	expect(result).toBeDefined();
	expect(result?.key).toBe("lix_deterministic_mode");
	expect(result?.value).toEqual({ enabled: true, randomLixId: false }); // JSON values are preserved
});

test("deterministic mode config with global version_id is persisted correctly", async () => {
	const blob = await newLixFile({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true, randomLixId: true },
				lixcol_version_id: "global",
			},
		],
	});
	const lix = await openLix({ blob });

	// Check that lix_deterministic_mode exists with global version_id
	const result = await lix.db
		.selectFrom("key_value_by_version")
		.where("key", "=", "lix_deterministic_mode")
		.where("lixcol_version_id", "=", "global")
		.select(["key", "value"])
		.executeTakeFirst();

	expect(result).toBeDefined();
	expect(result?.key).toBe("lix_deterministic_mode");
	expect(result?.value).toEqual({ enabled: true, randomLixId: true }); // JSON values are preserved
});

test("newLixFile does not create accounts during bootstrap", async () => {
	const blob = await newLixFile();
	const lix = await openLix({ blob });

	const allAccounts = await lix.db
		.selectFrom("account_by_version")
		.selectAll()
		.execute();

	expect(allAccounts.length).toBe(0);

	const activeAccounts = await lix.db
		.selectFrom("active_account")
		.selectAll()
		.execute();

	expect(activeAccounts.length).toBe(0);

	await lix.close();
});
