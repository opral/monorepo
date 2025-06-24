import { test, expect } from "vitest";
import { newLixFile } from "./new-lix.js";
import { openLixInMemory } from "./open-lix-in-memory.js";
import { LixSchemaViewMap } from "../database/schema.js";

test("newLixFile creates a valid lix that can be reopened", async () => {
	// Create a new lix file
	const blob = await newLixFile();
	expect(blob.size).toBeGreaterThan(0);

	// Open the created lix file
	const lix = await openLixInMemory({ blob });

	// Try to query the state table to ensure it works
	const result = await lix.db.selectFrom("state_all").selectAll().execute();
	expect(Array.isArray(result)).toBe(true);
});

test("newLixFile creates a global and main version", async () => {
	const blob = await newLixFile();
	const lix = await openLixInMemory({ blob });

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
	const lix = await openLixInMemory({ blob });

	// Check that change sets exist (should be 4: 2 for global, 2 for main)
	const changeSets = await lix.db
		.selectFrom("change_set")
		.selectAll()
		.execute();

	expect(changeSets).toHaveLength(4);
});

test("newLixFile creates checkpoint label", async () => {
	const blob = await newLixFile();
	const lix = await openLixInMemory({ blob });

	// Check that checkpoint label exists
	const labels = await lix.db.selectFrom("label").selectAll().execute();

	expect(labels).toHaveLength(1);
	expect(labels[0]?.name).toBe("checkpoint");
});

test("newLixFile creates all schema definitions", async () => {
	const blob = await newLixFile();
	const lix = await openLixInMemory({ blob });

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
	const lix = await openLixInMemory({ blob });

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
	const lix = await openLixInMemory({ blob });

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
