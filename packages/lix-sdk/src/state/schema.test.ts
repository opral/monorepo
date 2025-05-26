import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import { sql } from "kysely";
import { createVersion } from "../version/create-version.js";

test("select, insert, update, delete entity", async () => {
	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			value: {
				type: "string",
			},
		},
	};

	const lix = await openLixInMemory({});

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	await lix.db
		.insertInto("state")
		.values({
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			schema_version: "1.0",
			version_id: sql`(SELECT version_id FROM active_version)`,
			snapshot_content: {
				value: "hello world",
			},
		})
		.execute();

	const viewAfterInsert = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", "mock_schema")
		.selectAll()
		.execute();

	expect(viewAfterInsert).toMatchObject([
		{
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			snapshot_content: {
				value: "hello world",
			},
		},
	]);

	await lix.db
		.updateTable("state")
		.set({
			snapshot_content: {
				value: "hello world - updated",
			},
		})
		.where("entity_id", "=", "e0")
		.where("schema_key", "=", "mock_schema")
		.where("file_id", "=", "f0")
		.execute();

	const viewAfterUpdate = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", "mock_schema")
		.selectAll()
		.execute();

	expect(viewAfterUpdate).toMatchObject([
		{
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			snapshot_content: {
				value: "hello world - updated",
			},
		},
	]);

	await lix.db
		.deleteFrom("state")
		.where("entity_id", "=", "e0")
		.where(
			"version_id",
			"=",
			lix.db.selectFrom("active_version").select("version_id")
		)
		.where("schema_key", "=", "mock_schema")
		.execute();

	const viewAfterDelete = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", "mock_schema")
		.selectAll()
		.execute();

	expect(viewAfterDelete).toHaveLength(0);
});

test("validates the schema on insert", async () => {
	const lix = await openLixInMemory({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			value: {
				type: "number",
			},
		},
	};

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();
	await expect(
		lix.db
			.insertInto("state")
			.values({
				entity_id: "e0",
				file_id: "f0",
				schema_key: "mock_schema",
				plugin_key: "lix_own_entity",
				schema_version: "1.0",
				snapshot_content: {
					value: "hello world",
				},
				version_id: sql`(SELECT version_id FROM active_version)`,
			})
			.execute()
	).rejects.toThrow(/value must be number/);
});

test("validates the schema on update", async () => {
	const lix = await openLixInMemory({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			value: {
				type: "number",
			},
		},
	};

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	await lix.db
		.insertInto("state")
		.values({
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			schema_version: "1.0",
			snapshot_content: {
				value: 5,
			},
			version_id: sql`(SELECT version_id FROM active_version)`,
		})
		.execute();

	await expect(
		lix.db
			.updateTable("state")
			.set({
				snapshot_content: {
					value: "hello world - updated",
				},
			})
			.where("entity_id", "=", "e0")
			.where("schema_key", "=", "mock_schema")
			.where("file_id", "=", "f0")
			.execute()
	).rejects.toThrow(/value must be number/);

	const viewAfterFailedUpdate = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", "mock_schema")
		.selectAll()
		.execute();

	expect(viewAfterFailedUpdate).toMatchObject([
		{
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			snapshot_content: {
				value: 5,
			},
		},
	]);
});

test("state is separated by version", async () => {
	const lix = await openLixInMemory({});

	await createVersion({ lix, id: "version_a" });
	await createVersion({ lix, id: "version_b" });

	await lix.db
		.insertInto("state")
		.values([
			{
				entity_id: "e0",
				file_id: "f0",
				schema_key: "mock_schema",
				plugin_key: "mock_plugin",
				schema_version: "1.0",
				snapshot_content: {
					value: "hello world from version a",
				},
				version_id: "version_a",
			},
			{
				entity_id: "e0",
				file_id: "f0",
				schema_key: "mock_schema",
				plugin_key: "mock_plugin",
				schema_version: "1.0",
				snapshot_content: {
					value: "hello world from version b",
				},
				version_id: "version_b",
			},
		])
		.execute();

	const stateAfterInserts = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", "mock_schema")
		.where("entity_id", "=", "e0")
		.selectAll()
		.execute();

	expect(stateAfterInserts).toMatchObject([
		{
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "mock_plugin",
			snapshot_content: {
				value: "hello world from version a",
			},
			version_id: "version_a",
		},
		{
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "mock_plugin",
			snapshot_content: {
				value: "hello world from version b",
			},
			version_id: "version_b",
		},
	]);

	// Verify timestamps are present
	expect(stateAfterInserts[0]?.created_at).toBeDefined();
	expect(stateAfterInserts[0]?.updated_at).toBeDefined();
	expect(stateAfterInserts[1]?.created_at).toBeDefined();
	expect(stateAfterInserts[1]?.updated_at).toBeDefined();

	await lix.db
		.updateTable("state")
		.set({ snapshot_content: { value: "hello world from version b UPDATED" } })
		.where("entity_id", "=", "e0")
		.where("schema_key", "=", "mock_schema")
		.where("version_id", "=", "version_b")
		.execute();

	const stateAfterUpdate = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", "mock_schema")
		.where("entity_id", "=", "e0")
		.selectAll()
		.execute();

	expect(stateAfterUpdate).toMatchObject([
		{
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "mock_plugin",
			snapshot_content: {
				value: "hello world from version a",
			},
			version_id: "version_a",
		},
		{
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "mock_plugin",
			snapshot_content: {
				value: "hello world from version b UPDATED",
			},
			version_id: "version_b",
		},
	]);

	await lix.db
		.deleteFrom("state")
		.where("entity_id", "=", "e0")
		.where("version_id", "=", "version_b")
		.execute();

	const stateAfterDelete = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", "mock_schema")
		.where("entity_id", "=", "e0")
		.selectAll()
		.execute();

	expect(stateAfterDelete).toMatchObject([
		{
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "mock_plugin",
			snapshot_content: {
				value: "hello world from version a",
			},
			version_id: "version_a",
		},
	]);
});

test("created_at and updated_at timestamps are computed correctly", async () => {
	const lix = await openLixInMemory({});

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			value: {
				type: "string",
			},
		},
	};

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	// Insert initial entity
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			schema_version: "1.0",
			version_id: sql`(SELECT version_id FROM active_version)`,
			snapshot_content: {
				value: "initial value",
			},
		})
		.execute();

	const stateAfterInsert = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "e0")
		.selectAll()
		.execute();

	expect(stateAfterInsert).toHaveLength(1);
	expect(stateAfterInsert[0]?.created_at).toBeDefined();
	expect(stateAfterInsert[0]?.updated_at).toBeDefined();
	expect(stateAfterInsert[0]?.created_at).toBe(stateAfterInsert[0]?.updated_at);

	// Wait a bit to ensure different timestamps
	await new Promise((resolve) => setTimeout(resolve, 1));

	// Update the entity
	await lix.db
		.updateTable("state")
		.set({
			snapshot_content: {
				value: "updated value",
			},
		})
		.where("entity_id", "=", "e0")
		.where("schema_key", "=", "mock_schema")
		.execute();

	const stateAfterUpdate = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "e0")
		.selectAll()
		.execute();

	expect(stateAfterUpdate).toHaveLength(1);
	expect(stateAfterUpdate[0]?.created_at).toBeDefined();
	expect(stateAfterUpdate[0]?.updated_at).toBeDefined();
	// created_at should remain the same
	expect(stateAfterUpdate[0]?.created_at).toBe(stateAfterInsert[0]?.created_at);
	// updated_at should be different (newer)
	expect(stateAfterUpdate[0]?.updated_at).not.toBe(
		stateAfterInsert[0]?.updated_at
	);
	expect(new Date(stateAfterUpdate[0]!.updated_at).getTime()).toBeGreaterThan(
		new Date(stateAfterInsert[0]!.updated_at).getTime()
	);
});

test("created_at and updated_at are version specific", async () => {
	const lix = await openLixInMemory({});

	await createVersion({ lix, id: "version_a" });
	await createVersion({ lix, id: "version_b" });

	const mockSchema: LixSchemaDefinition = {
		"x-lix-key": "mock_schema",
		"x-lix-version": "1.0",
		type: "object",
		properties: {
			value: {
				type: "string",
			},
		},
	};

	await lix.db
		.insertInto("stored_schema")
		.values({ value: mockSchema })
		.execute();

	// Insert entity in version A
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			schema_version: "1.0",
			version_id: "version_a",
			snapshot_content: {
				value: "value in version a",
			},
		})
		.execute();

	// Wait a bit to ensure different timestamps
	await new Promise((resolve) => setTimeout(resolve, 1));

	// Insert same entity in version B
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "lix_own_entity",
			schema_version: "1.0",
			version_id: "version_b",
			snapshot_content: {
				value: "value in version b",
			},
		})
		.execute();

	const stateVersionA = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "e0")
		.where("version_id", "=", "version_a")
		.selectAll()
		.execute();

	const stateVersionB = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "e0")
		.where("version_id", "=", "version_b")
		.selectAll()
		.execute();

	expect(stateVersionA).toHaveLength(1);
	expect(stateVersionB).toHaveLength(1);

	// Both should have timestamps
	expect(stateVersionA[0]?.created_at).toBeDefined();
	expect(stateVersionA[0]?.updated_at).toBeDefined();
	expect(stateVersionB[0]?.created_at).toBeDefined();
	expect(stateVersionB[0]?.updated_at).toBeDefined();

	// created_at should be the same for both versions (same entity)
	expect(stateVersionA[0]?.created_at).toBe(stateVersionB[0]?.created_at);

	// Wait and update only version B
	await new Promise((resolve) => setTimeout(resolve, 1));

	await lix.db
		.updateTable("state")
		.set({
			snapshot_content: {
				value: "updated value in version b",
			},
		})
		.where("entity_id", "=", "e0")
		.where("version_id", "=", "version_b")
		.execute();

	const updatedStateVersionA = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "e0")
		.where("version_id", "=", "version_a")
		.selectAll()
		.execute();

	const updatedStateVersionB = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "e0")
		.where("version_id", "=", "version_b")
		.selectAll()
		.execute();

	// Version A should remain unchanged
	expect(updatedStateVersionA[0]?.updated_at).toBe(
		stateVersionA[0]?.updated_at
	);

	// Version B should have updated timestamp
	expect(updatedStateVersionB[0]?.updated_at).not.toBe(
		stateVersionB[0]?.updated_at
	);
	expect(
		new Date(updatedStateVersionB[0]!.updated_at).getTime()
	).toBeGreaterThan(new Date(stateVersionB[0]!.updated_at).getTime());
});

test("state appears in both versions when they share the same change set", async () => {
	const lix = await openLixInMemory({});

	const versionA = await createVersion({ lix, id: "version_a" });

	console.log(
		"Version A changeset before state insert:",
		versionA.change_set_id
	);

	// Insert state into version A
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "mock_plugin",
			schema_version: "1.0",
			snapshot_content: {
				value: "shared state",
			},
			version_id: "version_a",
		})
		.execute();

	const versionAAfterInsert = await lix.db
		.selectFrom("version")
		.where("id", "=", versionA.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	console.log(
		"Version A changeset after state insert:",
		versionAAfterInsert.change_set_id
	);

	// Create version B with the same change set as version A
	const versionB = await createVersion({
		lix,
		id: "version_b",
		changeSet: { id: versionAAfterInsert.change_set_id },
	});

	console.log("Version B changeset:", versionB.change_set_id);

	const stateInBothVersions = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", "mock_schema")
		.where("entity_id", "=", "e0")
		.selectAll()
		.execute();

	// Both versions should see the same state
	expect(stateInBothVersions).toMatchObject([
		{
			entity_id: "e0",
			schema_key: "mock_schema",
			snapshot_content: { value: "shared state" },
			version_id: "version_a",
		},
		{
			entity_id: "e0",
			schema_key: "mock_schema",
			snapshot_content: { value: "shared state" },
			version_id: "version_b",
		},
	]);
});

test("direct state insertion vs view insertion changeset behavior", async () => {
	const lix = await openLixInMemory({});

	// Test 1: Insert via key_value view
	const versionBefore = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Log changes before key_value insert
	const changesBefore = await sql`
		SELECT 
			ic.entity_id,
			ic.schema_key,
			ic.created_at,
			json_extract(s.content, '$.change_set_id') as content_change_set_id
		FROM internal_change ic
		LEFT JOIN internal_snapshot s ON ic.snapshot_id = s.id
		WHERE ic.schema_key IN ('lix_version', 'lix_change_set', 'lix_change_set_element', 'lix_change_set_edge')
		ORDER BY ic.created_at DESC
		LIMIT 10
	`.execute(lix.db);

	console.log("Changes before key_value insert:", changesBefore.rows);

	await lix.db
		.insertInto("key_value")
		.values({
			key: "test_key",
			value: "test_value",
		})
		.execute();

	// Log changes after key_value insert
	const changesAfterKeyValue = await sql`
		SELECT 
			ic.entity_id,
			ic.schema_key,
			ic.created_at,
			json_extract(s.content, '$.change_set_id') as content_change_set_id
		FROM internal_change ic
		LEFT JOIN internal_snapshot s ON ic.snapshot_id = s.id
		WHERE ic.schema_key IN ('lix_version', 'lix_change_set', 'lix_change_set_element', 'lix_change_set_edge')
		ORDER BY ic.created_at DESC
		LIMIT 10
	`.execute(lix.db);

	console.log("Changes after key_value insert:", changesAfterKeyValue.rows);

	const versionAfterKeyValue = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	console.log("Version changeset before key_value insert:", versionBefore.change_set_id);
	console.log("Version changeset after key_value insert:", versionAfterKeyValue.change_set_id);

	// Test 2: Insert directly into state table
	const testVersion = await createVersion({ lix, id: "test_version" });
	
	// Log changes before state insert
	const changesBeforeState = await sql`
		SELECT 
			ic.entity_id,
			ic.schema_key,
			ic.created_at,
			json_extract(s.content, '$.change_set_id') as content_change_set_id
		FROM internal_change ic
		LEFT JOIN internal_snapshot s ON ic.snapshot_id = s.id
		WHERE ic.schema_key IN ('lix_version', 'lix_change_set', 'lix_change_set_element', 'lix_change_set_edge')
		ORDER BY ic.created_at DESC
		LIMIT 10
	`.execute(lix.db);

	console.log("Changes before state insert:", changesBeforeState.rows);
	
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "mock_plugin",
			schema_version: "1.0",
			snapshot_content: {
				value: "test state",
			},
			version_id: "test_version",
		})
		.execute();

	// Log changes after state insert
	const changesAfterState = await sql`
		SELECT 
			ic.entity_id,
			ic.schema_key,
			ic.created_at,
			json_extract(s.content, '$.change_set_id') as content_change_set_id
		FROM internal_change ic
		LEFT JOIN internal_snapshot s ON ic.snapshot_id = s.id
		WHERE ic.schema_key IN ('lix_version', 'lix_change_set', 'lix_change_set_element', 'lix_change_set_edge')
		ORDER BY ic.created_at DESC
		LIMIT 10
	`.execute(lix.db);

	console.log("Changes after state insert:", changesAfterState.rows);

	const testVersionAfter = await lix.db
		.selectFrom("version")
		.where("id", "=", "test_version")
		.selectAll()
		.executeTakeFirstOrThrow();

	console.log("Test version changeset before state insert:", testVersion.change_set_id);
	console.log("Test version changeset after state insert:", testVersionAfter.change_set_id);

	// key_value view should update the version's changeset
	expect(versionAfterKeyValue.change_set_id).not.toBe(versionBefore.change_set_id);
	
	// Direct state insertion should also update the version's changeset
	expect(testVersionAfter.change_set_id).not.toBe(testVersion.change_set_id);
});

test("state diverges when versions have common ancestor but different changes", async () => {
	const lix = await openLixInMemory({});

	// Create base version and add initial state
	const baseVersion = await createVersion({ lix, id: "base_version" });

	await lix.db
		.insertInto("state")
		.values({
			entity_id: "e0",
			file_id: "f0",
			schema_key: "mock_schema",
			plugin_key: "mock_plugin",
			schema_version: "1.0",
			snapshot_content: {
				value: "base state",
			},
			version_id: "base_version",
		})
		.execute();

	const baseVersionAfterInsert = await lix.db
		.selectFrom("version")
		.where("id", "=", baseVersion.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	// Create two versions from the same base changeset
	const versionA = await createVersion({
		lix,
		id: "version_a",
		changeSet: { id: baseVersionAfterInsert.change_set_id },
	});

	const versionB = await createVersion({
		lix,
		id: "version_b",
		changeSet: { id: baseVersionAfterInsert.change_set_id },
	});

	// Both versions should initially see the base state
	const initialState = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", "mock_schema")
		.where("entity_id", "=", "e0")
		.selectAll()
		.execute();

	expect(initialState).toHaveLength(3); // base, version_a, version_b

	// Update state in version A
	await lix.db
		.updateTable("state")
		.set({
			snapshot_content: { value: "updated in version A" },
		})
		.where("entity_id", "=", "e0")
		.where("version_id", "=", "version_a")
		.execute();

	// Update state in version B differently
	await lix.db
		.updateTable("state")
		.set({
			snapshot_content: { value: "updated in version B" },
		})
		.where("entity_id", "=", "e0")
		.where("version_id", "=", "version_b")
		.execute();

	const divergedState = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", "mock_schema")
		.where("entity_id", "=", "e0")
		.selectAll()
		.execute();

	// All three versions should have different states
	expect(divergedState).toMatchObject([
		{
			entity_id: "e0",
			snapshot_content: { value: "base state" },
			version_id: "base_version",
		},
		{
			entity_id: "e0",
			snapshot_content: { value: "updated in version A" },
			version_id: "version_a",
		},
		{
			entity_id: "e0",
			snapshot_content: { value: "updated in version B" },
			version_id: "version_b",
		},
	]);
});
