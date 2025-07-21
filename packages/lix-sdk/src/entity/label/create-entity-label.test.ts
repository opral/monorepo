import { expect, test } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { createLabel } from "../../label/create-label.js";
import { createEntityLabel, deleteEntityLabel } from "./create-entity-label.js";

test("createEntityLabel creates a mapping between entity and label", async () => {
	const lix = await openLix({});

	// Create a label
	const label = await createLabel({ lix, name: "important" });

	// Create an entity in state
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "doc123",
			schema_key: "document",
			file_id: "docs.json",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			snapshot_content: { id: "doc123", title: "User Guide" },
		})
		.execute();

	// Create entity-label mapping
	await createEntityLabel({
		lix,
		entity: {
			entity_id: "doc123",
			schema_key: "document",
			file_id: "docs.json",
		},
		label: { id: label.id },
	});

	// Verify mapping was created
	const mapping = await lix.db
		.selectFrom("entity_label")
		.where("entity_id", "=", "doc123")
		.where("label_id", "=", label.id)
		.selectAll()
		.executeTakeFirst();

	expect(mapping).toMatchObject({
		entity_id: "doc123",
		schema_key: "document",
		file_id: "docs.json",
		label_id: label.id,
	});
});

test("createEntityLabel throws error if entity doesn't exist", async () => {
	const lix = await openLix({});

	const label = await createLabel({ lix, name: "test-label" });

	// Try to create mapping for non-existent entity
	await expect(
		createEntityLabel({
			lix,
			entity: {
				entity_id: "non-existent",
				schema_key: "document",
				file_id: "docs.json",
			},
			label: { id: label.id },
		})
	).rejects.toThrow('Entity with id "non-existent" (schema: document, file: docs.json) does not exist in state');
});

test("createEntityLabel throws error if label doesn't exist", async () => {
	const lix = await openLix({});

	// Create an entity in state
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "doc123",
			schema_key: "document",
			file_id: "docs.json",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			snapshot_content: { id: "doc123" },
		})
		.execute();

	// Try to create mapping with non-existent label
	await expect(
		createEntityLabel({
			lix,
			entity: {
				entity_id: "doc123",
				schema_key: "document",
				file_id: "docs.json",
			},
			label: { id: "non-existent-label" },
		})
	).rejects.toThrow('Label with id "non-existent-label" does not exist');
});

test("createEntityLabel is idempotent - doesn't fail if mapping already exists", async () => {
	const lix = await openLix({});

	const label = await createLabel({ lix, name: "idempotent-test" });

	// Create entity
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "doc456",
			schema_key: "document",
			file_id: "docs.json",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			snapshot_content: { id: "doc456" },
		})
		.execute();

	// Create mapping first time
	await createEntityLabel({
		lix,
		entity: {
			entity_id: "doc456",
			schema_key: "document",
			file_id: "docs.json",
		},
		label: { id: label.id },
	});

	// Create same mapping again - should not throw
	await expect(
		createEntityLabel({
			lix,
			entity: {
				entity_id: "doc456",
				schema_key: "document",
				file_id: "docs.json",
			},
			label: { id: label.id },
		})
	).resolves.toBeUndefined();

	// Verify only one mapping exists
	const mappings = await lix.db
		.selectFrom("entity_label")
		.where("entity_id", "=", "doc456")
		.where("label_id", "=", label.id)
		.selectAll()
		.execute();

	expect(mappings).toHaveLength(1);
});

test("deleteEntityLabel removes the mapping", async () => {
	const lix = await openLix({});

	const label = await createLabel({ lix, name: "removable" });

	// Create entity
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "doc789",
			schema_key: "document",
			file_id: "docs.json",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			snapshot_content: { id: "doc789" },
		})
		.execute();

	// Create mapping
	await createEntityLabel({
		lix,
		entity: {
			entity_id: "doc789",
			schema_key: "document",
			file_id: "docs.json",
		},
		label: { id: label.id },
	});

	// Verify mapping exists
	const beforeRemove = await lix.db
		.selectFrom("entity_label")
		.where("entity_id", "=", "doc789")
		.selectAll()
		.execute();

	expect(beforeRemove).toHaveLength(1);

	// Remove mapping
	await deleteEntityLabel({
		lix,
		entity: {
			entity_id: "doc789",
			schema_key: "document",
			file_id: "docs.json",
		},
		label: { id: label.id },
	});

	// Verify mapping is gone
	const afterRemove = await lix.db
		.selectFrom("entity_label")
		.where("entity_id", "=", "doc789")
		.selectAll()
		.execute();

	expect(afterRemove).toHaveLength(0);
});

test("createEntityLabel works with change_set entities", async () => {
	const lix = await openLix({});

	const reviewedLabel = await createLabel({ lix, name: "reviewed" });

	// Create a change set
	await lix.db
		.insertInto("change_set")
		.values({
			id: "cs789",
		})
		.execute();

	// Label the change set
	await createEntityLabel({
		lix,
		entity: {
			entity_id: "cs789",
			schema_key: "lix_change_set",
			file_id: "lix",
		},
		label: { id: reviewedLabel.id },
	});

	// Verify the label was applied by checking entity_label table directly
	const mapping = await lix.db
		.selectFrom("entity_label")
		.where("entity_id", "=", "cs789")
		.where("schema_key", "=", "lix_change_set")
		.where("file_id", "=", "lix")
		.selectAll()
		.executeTakeFirst();

	expect(mapping).toBeDefined();
	expect(mapping?.label_id).toBe(reviewedLabel.id);
});