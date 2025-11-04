import { expect, test } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { createLabel } from "../../label/create-label.js";
import { attachLabel, detachLabel } from "./attach-label.js";
import { mockJsonPlugin } from "../../plugin/mock-json-plugin.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";

const documentSchema: LixSchemaDefinition = {
	"x-lix-key": "test_document",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
	type: "object",
	additionalProperties: false,
	properties: {
		id: { type: "string" },
		title: { type: "string" },
	},
	required: ["id"],
} as const;

test("attachLabel creates a mapping between entity and label", async () => {
	const lix = await openLix({});

	// Create a label
	const label = await createLabel({ lix, name: "important" });

	await lix.db
		.insertInto("stored_schema")
		.values({ value: documentSchema })
		.execute();

	// Create an entity in state
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "doc123",
			schema_key: "test_document",
			file_id: "docs.json",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			snapshot_content: { id: "doc123", title: "User Guide" },
		})
		.execute();

	// Create entity-label mapping
	await attachLabel({
		lix,
		entity: {
			entity_id: "doc123",
			schema_key: "test_document",
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
		schema_key: "test_document",
		file_id: "docs.json",
		label_id: label.id,
	});
});

test("attachLabel throws error if entity doesn't exist", async () => {
	const lix = await openLix({});

	const label = await createLabel({ lix, name: "test-label" });

	// Try to create mapping for non-existent entity
	// Should throw foreign key constraint error
	await expect(
		attachLabel({
			lix,
			entity: {
				entity_id: "non-existent",
				schema_key: "test_document",
				file_id: "docs.json",
			},
			label: { id: label.id },
		})
	).rejects.toThrow(
		/Foreign key constraint violation.*lix_entity_label.*\(\/entity_id, \/schema_key, \/file_id\).*state\.\(\/entity_id, \/schema_key, \/file_id\)/
	);
});

test("attachLabel throws error if label doesn't exist", async () => {
	const lix = await openLix({});

	await lix.db
		.insertInto("stored_schema")
		.values({ value: documentSchema })
		.execute();

	// Create an entity in state
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "doc123",
			schema_key: "test_document",
			file_id: "docs.json",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			snapshot_content: { id: "doc123" },
		})
		.execute();

	// Try to create mapping with non-existent label
	// Should throw foreign key constraint error
	await expect(
		attachLabel({
			lix,
			entity: {
				entity_id: "doc123",
				schema_key: "test_document",
				file_id: "docs.json",
			},
			label: { id: "non-existent-label" },
		})
	).rejects.toThrow(
		/Foreign key constraint violation.*lix_entity_label.*\(\/label_id\).*lix_label\.\(\/id\)/
	);
});

test("attachLabel is idempotent - doesn't fail if mapping already exists", async () => {
	const lix = await openLix({});

	const label = await createLabel({ lix, name: "idempotent-test" });

	await lix.db
		.insertInto("stored_schema")
		.values({ value: documentSchema })
		.execute();

	// Create entity
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "doc456",
			schema_key: "test_document",
			file_id: "docs.json",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			snapshot_content: { id: "doc456" },
		})
		.execute();

	// Create mapping first time
	await attachLabel({
		lix,
		entity: {
			entity_id: "doc456",
			schema_key: "test_document",
			file_id: "docs.json",
		},
		label: { id: label.id },
	});

	// Create same mapping again - should not throw
	await expect(
		attachLabel({
			lix,
			entity: {
				entity_id: "doc456",
				schema_key: "test_document",
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

test("detachLabel removes the mapping", async () => {
	const lix = await openLix({});

	const label = await createLabel({ lix, name: "removable" });

	await lix.db
		.insertInto("stored_schema")
		.values({ value: documentSchema })
		.execute();

	// Create entity
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "doc789",
			schema_key: "test_document",
			file_id: "docs.json",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			snapshot_content: { id: "doc789" },
		})
		.execute();

	// Create mapping
	await attachLabel({
		lix,
		entity: {
			entity_id: "doc789",
			schema_key: "test_document",
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
	await detachLabel({
		lix,
		entity: {
			entity_id: "doc789",
			schema_key: "test_document",
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

test("attachLabel works with change_set entities", async () => {
	const lix = await openLix({});

	const reviewedLabel = await createLabel({
		lix,
		name: "reviewed",
		lixcol_version_id: "global",
	});

	// Create a change set
	await lix.db
		.insertInto("change_set")
		.values({
			id: "cs789",
		})
		.execute();

	// Label the change set
	await attachLabel({
		lix,
		entity: {
			entity_id: "cs789",
			schema_key: "lix_change_set",
			file_id: "lix",
		},
		label: { id: reviewedLabel.id },
		versionId: "global",
	});

	// Verify the label was applied by checking entity_label table directly
	const mapping = await lix.db
		.selectFrom("entity_label_by_version")
		.where("entity_id", "=", "cs789")
		.where("schema_key", "=", "lix_change_set")
		.where("file_id", "=", "lix")
		.where("lixcol_version_id", "=", "global")
		.selectAll()
		.executeTakeFirst();

	expect(mapping).toBeDefined();
	expect(mapping?.label_id).toBe(reviewedLabel.id);
});

test("attachLabel works with files", async () => {
	const lix = await openLix({
		providePlugins: [mockJsonPlugin],
	});

	const importantLabel = await createLabel({ lix, name: "important-file" });

	// Create a file
	await lix.db
		.insertInto("file")
		.values({
			id: "test-file-123",
			path: "/important-data.json",
			data: new TextEncoder().encode(
				JSON.stringify({
					title: "Important Data",
					content: "This file contains critical information",
				})
			),
		})
		.execute();

	// Get the file to retrieve its lixcol_* columns
	const file = await lix.db
		.selectFrom("file")
		.where("id", "=", "test-file-123")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Label the file using its lixcol_* columns
	await attachLabel({
		lix,
		entity: file,
		label: importantLabel,
	});

	// Verify the label was applied
	const mapping = await lix.db
		.selectFrom("entity_label")
		.where("entity_id", "=", file.lixcol_entity_id)
		.where("schema_key", "=", "lix_file_descriptor")
		.where("file_id", "=", file.lixcol_file_id)
		.selectAll()
		.executeTakeFirst();

	expect(mapping).toBeDefined();
	expect(mapping?.label_id).toBe(importantLabel.id);

	// Also verify we can query files by label using entityEb
	const { ebEntity: entityEb } = await import("../eb-entity.js");

	const importantFiles = await lix.db
		.selectFrom("file")
		.where(entityEb("file").hasLabel(importantLabel))
		.selectAll()
		.execute();

	expect(importantFiles).toHaveLength(1);
	expect(importantFiles[0]?.id).toBe("test-file-123");
});
