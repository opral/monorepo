import { expect, test } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { createLabel } from "../../label/create-label.js";

test("entity_label mapping requires entity to exist in state", async () => {
	const lix = await openLix({});

	// First create a label
	const needsTranslationLabel = await createLabel({
		lix,
		name: "needs translation",
	});

	// Create an entity in state (simulate a bundle entity)
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "bundle123",
			schema_key: "inlang_bundle",
			file_id: "messages.json",
			schema_version: "1.0",
			plugin_key: "test_plugin",
			snapshot_content: {
				id: "bundle123",
				key: "hello.world",
				messages: {},
			},
		})
		.execute();

	// Now map the label to the entity
	await lix.db
		.insertInto("entity_label")
		.values({
			entity_id: "bundle123",
			schema_key: "inlang_bundle",
			file_id: "messages.json",
			label_id: needsTranslationLabel.id,
		})
		.execute();

	// Query the mapping
	const mapping = await lix.db
		.selectFrom("entity_label")
		.where("entity_id", "=", "bundle123")
		.selectAll()
		.executeTakeFirst();

	expect(mapping).toMatchObject({
		entity_id: "bundle123",
		schema_key: "inlang_bundle",
		file_id: "messages.json",
		label_id: needsTranslationLabel.id,
	});
});

test("entity can have multiple labels", async () => {
	const lix = await openLix({});

	const labels = await Promise.all([
		createLabel({ lix, name: "critical" }),
		createLabel({ lix, name: "in-progress" }),
		createLabel({ lix, name: "backend" }),
	]);

	// Create an entity in state
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "task456",
			schema_key: "project_task",
			file_id: "tasks.json",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			snapshot_content: {
				id: "task456",
				title: "Fix API endpoint",
				status: "open",
			},
		})
		.execute();

	// Add multiple labels to the same entity
	for (const label of labels) {
		await lix.db
			.insertInto("entity_label")
			.values({
				entity_id: "task456",
				schema_key: "project_task",
				file_id: "tasks.json",
				label_id: label.id,
			})
			.execute();
	}

	// Query all labels for the entity
	const entityLabels = await lix.db
		.selectFrom("entity_label")
		.innerJoin("label", "label.id", "entity_label.label_id")
		.where("entity_label.entity_id", "=", "task456")
		.select(["label.name", "entity_label.label_id"])
		.execute();

	expect(entityLabels).toHaveLength(3);
	expect(entityLabels.map((el) => el.name).sort()).toEqual([
		"backend",
		"critical",
		"in-progress",
	]);
});

test("same label can be applied to multiple entities", async () => {
	const lix = await openLix({});

	const urgentLabel = await createLabel({ lix, name: "urgent" });

	// Create multiple entities in state
	const entities = [
		{
			entity_id: "bug1",
			schema_key: "bug_report",
			file_id: "bugs.json",
			content: { id: "bug1", title: "Login fails", severity: "high" },
		},
		{
			entity_id: "feature1",
			schema_key: "feature_request",
			file_id: "features.json",
			content: { id: "feature1", title: "Dark mode", priority: "high" },
		},
		{
			entity_id: "task1",
			schema_key: "task",
			file_id: "tasks.json",
			content: { id: "task1", title: "Update docs", assigned: "john" },
		},
	];

	// Create entities in state
	for (const entity of entities) {
		await lix.db
			.insertInto("state")
			.values({
				entity_id: entity.entity_id,
				schema_key: entity.schema_key,
				file_id: entity.file_id,
				plugin_key: "test_plugin",
				schema_version: "1.0",
				snapshot_content: entity.content,
			})
			.execute();
	}

	// Apply the same label to all entities
	for (const entity of entities) {
		await lix.db
			.insertInto("entity_label")
			.values({
				entity_id: entity.entity_id,
				schema_key: entity.schema_key,
				file_id: entity.file_id,
				label_id: urgentLabel.id,
			})
			.execute();
	}

	// Query all entities with the urgent label
	const urgentEntities = await lix.db
		.selectFrom("entity_label")
		.where("label_id", "=", urgentLabel.id)
		.select(["entity_id", "schema_key", "file_id"])
		.execute();

	expect(urgentEntities).toHaveLength(3);
	expect(urgentEntities.map((e) => e.entity_id).sort()).toEqual([
		"bug1",
		"feature1",
		"task1",
	]);
});

test("entity_label respects composite primary key constraint", async () => {
	const lix = await openLix({});

	const label = await createLabel({ lix, name: "duplicate-test" });

	// Create entity in state
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "entity1",
			schema_key: "test_entity",
			file_id: "test.json",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			snapshot_content: { id: "entity1", data: "test" },
		})
		.execute();

	// Insert initial mapping
	await lix.db
		.insertInto("entity_label")
		.values({
			entity_id: "entity1",
			schema_key: "test_entity",
			file_id: "test.json",
			label_id: label.id,
		})
		.execute();

	// Try to insert duplicate (same entity + label combination)
	await expect(
		lix.db
			.insertInto("entity_label")
			.values({
				entity_id: "entity1",
				schema_key: "test_entity",
				file_id: "test.json",
				label_id: label.id,
			})
			.execute()
	).rejects.toThrow();
});

test("different entities with same ID but different schema_key or file_id can have same label", async () => {
	const lix = await openLix({});

	const label = await createLabel({ lix, name: "shared" });

	// Create entities in state with same ID but different schema_key
	await lix.db
		.insertInto("state")
		.values([
			{
				entity_id: "shared123",
				schema_key: "type_a",
				file_id: "file.json",
				plugin_key: "test_plugin",
				schema_version: "1.0",
				snapshot_content: { id: "shared123", type: "A" },
			},
			{
				entity_id: "shared123",
				schema_key: "type_b",
				file_id: "file.json",
				plugin_key: "test_plugin",
				schema_version: "1.0",
				snapshot_content: { id: "shared123", type: "B" },
			},
		])
		.execute();

	// Create entities with same ID and schema_key but different file_id
	await lix.db
		.insertInto("state")
		.values([
			{
				entity_id: "shared456",
				schema_key: "type_c",
				file_id: "file1.json",
				plugin_key: "test_plugin",
				schema_version: "1.0",
				snapshot_content: { id: "shared456", file: 1 },
			},
			{
				entity_id: "shared456",
				schema_key: "type_c",
				file_id: "file2.json",
				plugin_key: "test_plugin",
				schema_version: "1.0",
				snapshot_content: { id: "shared456", file: 2 },
			},
		])
		.execute();

	// Apply labels to all variations
	await lix.db
		.insertInto("entity_label")
		.values([
			{
				entity_id: "shared123",
				schema_key: "type_a",
				file_id: "file.json",
				label_id: label.id,
			},
			{
				entity_id: "shared123",
				schema_key: "type_b",
				file_id: "file.json",
				label_id: label.id,
			},
			{
				entity_id: "shared456",
				schema_key: "type_c",
				file_id: "file1.json",
				label_id: label.id,
			},
			{
				entity_id: "shared456",
				schema_key: "type_c",
				file_id: "file2.json",
				label_id: label.id,
			},
		])
		.execute();

	const allMappings = await lix.db
		.selectFrom("entity_label")
		.where("label_id", "=", label.id)
		.selectAll()
		.execute();

	expect(allMappings).toHaveLength(4);
});

test("removing entity_label mapping", async () => {
	const lix = await openLix({});

	const label = await createLabel({ lix, name: "removable" });

	// Create entity in state
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "entity789",
			schema_key: "test_entity",
			file_id: "test.json",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			snapshot_content: { id: "entity789", removable: true },
		})
		.execute();

	// Add mapping
	await lix.db
		.insertInto("entity_label")
		.values({
			entity_id: "entity789",
			schema_key: "test_entity",
			file_id: "test.json",
			label_id: label.id,
		})
		.execute();

	// Verify it exists
	const beforeDelete = await lix.db
		.selectFrom("entity_label")
		.where("entity_id", "=", "entity789")
		.selectAll()
		.execute();

	expect(beforeDelete).toHaveLength(1);

	// Remove the mapping
	await lix.db
		.deleteFrom("entity_label")
		.where("entity_id", "=", "entity789")
		.where("schema_key", "=", "test_entity")
		.where("file_id", "=", "test.json")
		.where("label_id", "=", label.id)
		.execute();

	// Verify it's gone
	const afterDelete = await lix.db
		.selectFrom("entity_label")
		.where("entity_id", "=", "entity789")
		.selectAll()
		.execute();

	expect(afterDelete).toHaveLength(0);
});

test("querying entities by label with proper state", async () => {
	const lix = await openLix({});

	// Create labels
	const todoLabel = await createLabel({ lix, name: "todo" });
	const doneLabel = await createLabel({ lix, name: "done" });

	// Create task entities in state
	const tasks = [
		{ id: "task1", status: "pending" },
		{ id: "task2", status: "pending" },
		{ id: "task3", status: "pending" },
		{ id: "task4", status: "completed" },
		{ id: "task5", status: "completed" },
	];

	for (const task of tasks) {
		await lix.db
			.insertInto("state")
			.values({
				entity_id: task.id,
				schema_key: "task",
				file_id: "tasks.json",
				plugin_key: "test_plugin",
				schema_version: "1.0",
				snapshot_content: task,
			})
			.execute();
	}

	// Label pending tasks as TODO
	for (let i = 1; i <= 3; i++) {
		await lix.db
			.insertInto("entity_label")
			.values({
				entity_id: `task${i}`,
				schema_key: "task",
				file_id: "tasks.json",
				label_id: todoLabel.id,
			})
			.execute();
	}

	// Label completed tasks as DONE
	for (let i = 4; i <= 5; i++) {
		await lix.db
			.insertInto("entity_label")
			.values({
				entity_id: `task${i}`,
				schema_key: "task",
				file_id: "tasks.json",
				label_id: doneLabel.id,
			})
			.execute();
	}

	// Query all TODO tasks
	const todoTasks = await lix.db
		.selectFrom("entity_label")
		.innerJoin("label", "label.id", "entity_label.label_id")
		.where("label.name", "=", "todo")
		.where("entity_label.schema_key", "=", "task")
		.select(["entity_label.entity_id"])
		.execute();

	expect(todoTasks).toHaveLength(3);
	expect(todoTasks.map((t) => t.entity_id).sort()).toEqual([
		"task1",
		"task2",
		"task3",
	]);

	// Query all DONE tasks
	const doneTasks = await lix.db
		.selectFrom("entity_label")
		.innerJoin("label", "label.id", "entity_label.label_id")
		.where("label.name", "=", "done")
		.where("entity_label.schema_key", "=", "task")
		.select(["entity_label.entity_id"])
		.execute();

	expect(doneTasks).toHaveLength(2);
	expect(doneTasks.map((t) => t.entity_id).sort()).toEqual(["task4", "task5"]);
});

test("entity_label works with change_set entities", async () => {
	const lix = await openLix({});

	// Create a label for change sets
	const reviewedLabel = await createLabel({
		lix,
		name: "reviewed",
		lixcol_version_id: "global",
	});

	// Create a change set (which automatically creates state entry)
	await lix.db
		.insertInto("change_set")
		.values({
			id: "cs123",
		})
		.execute();

	const changeSet = await lix.db
		.selectFrom("change_set")
		.where("id", "=", "cs123")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Label the change set
	await lix.db
		.insertInto("entity_label_all")
		.values({
			entity_id: changeSet.id,
			schema_key: "lix_change_set",
			file_id: "lix",
			label_id: reviewedLabel.id,
			lixcol_version_id: "global",
		})
		.execute();

	// Query labeled change sets
	const labeledChangeSets = await lix.db
		.selectFrom("entity_label")
		.innerJoin("label", "label.id", "entity_label.label_id")
		.where("entity_label.schema_key", "=", "lix_change_set")
		.where("label.name", "=", "reviewed")
		.select(["entity_label.entity_id"])
		.execute();

	expect(labeledChangeSets).toHaveLength(1);
	expect(labeledChangeSets[0]?.entity_id).toBe("cs123");
});

test("query entities with specific label combinations", async () => {
	const lix = await openLix({});

	// Create labels
	const bugLabel = await createLabel({ lix, name: "bug" });
	const criticalLabel = await createLabel({ lix, name: "critical" });
	const resolvedLabel = await createLabel({ lix, name: "resolved" });

	// Create issues in state
	const issues = [
		{ id: "issue1", title: "Critical bug", labels: [bugLabel, criticalLabel] },
		{ id: "issue2", title: "Minor bug", labels: [bugLabel] },
		{ id: "issue3", title: "Critical feature", labels: [criticalLabel] },
		{ id: "issue4", title: "Resolved bug", labels: [bugLabel, resolvedLabel] },
	];

	for (const issue of issues) {
		// Create issue in state
		await lix.db
			.insertInto("state")
			.values({
				entity_id: issue.id,
				schema_key: "issue",
				file_id: "issues.json",
				plugin_key: "test_plugin",
				schema_version: "1.0",
				snapshot_content: { id: issue.id, title: issue.title },
			})
			.execute();

		// Add labels
		for (const label of issue.labels) {
			await lix.db
				.insertInto("entity_label")
				.values({
					entity_id: issue.id,
					schema_key: "issue",
					file_id: "issues.json",
					label_id: label.id,
				})
				.execute();
		}
	}

	// Query critical bugs (entities with both "bug" AND "critical" labels)
	const criticalBugs = await lix.db
		.selectFrom("entity_label as el1")
		.innerJoin("entity_label as el2", (join) =>
			join
				.onRef("el1.entity_id", "=", "el2.entity_id")
				.onRef("el1.schema_key", "=", "el2.schema_key")
				.onRef("el1.file_id", "=", "el2.file_id")
		)
		.where("el1.label_id", "=", bugLabel.id)
		.where("el2.label_id", "=", criticalLabel.id)
		.where("el1.schema_key", "=", "issue")
		.select(["el1.entity_id"])
		.distinct()
		.execute();

	expect(criticalBugs).toHaveLength(1);
	expect(criticalBugs[0]?.entity_id).toBe("issue1");
});

// Foreign key constraint tests
test("entity_label foreign key constraint prevents referencing non-existent state entities", async () => {
	const lix = await openLix({});

	// Create a label
	const label = await createLabel({ lix, name: "test-label" });

	// Try to create entity_label mapping for non-existent entity
	// This should fail due to foreign key constraint on (entity_id, schema_key, file_id)
	await expect(
		lix.db
			.insertInto("entity_label")
			.values({
				entity_id: "non_existent_entity",
				schema_key: "non_existent_schema",
				file_id: "non_existent.json",
				label_id: label.id,
			})
			.execute()
	).rejects.toThrow(
		/Foreign key constraint violation.*lix_entity_label.*\(\/entity_id, \/schema_key, \/file_id\).*state\.\(\/entity_id, \/schema_key, \/file_id\)/
	);
});

test("entity_label foreign key constraint prevents referencing non-existent labels", async () => {
	const lix = await openLix({});

	// Create an entity in state
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "test_entity",
			schema_key: "test_schema",
			file_id: "test.json",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			snapshot_content: { id: "test_entity" },
		})
		.execute();

	// Try to create entity_label mapping with non-existent label
	// This should fail due to foreign key constraint on label_id
	await expect(
		lix.db
			.insertInto("entity_label")
			.values({
				entity_id: "test_entity",
				schema_key: "test_schema",
				file_id: "test.json",
				label_id: "non_existent_label_id",
			})
			.execute()
	).rejects.toThrow(
		/Foreign key constraint violation.*lix_entity_label.*\(\/label_id\).*lix_label\.\(\/id\)/
	);
});

test("entity_label composite foreign key correctly validates all three state columns", async () => {
	const lix = await openLix({});

	const label = await createLabel({ lix, name: "test-label" });

	// Create an entity in state
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "entity1",
			schema_key: "schema1",
			file_id: "file1.json",
			plugin_key: "test_plugin",
			schema_version: "1.0",
			snapshot_content: { id: "entity1" },
		})
		.execute();

	// Try with wrong entity_id - should fail
	await expect(
		lix.db
			.insertInto("entity_label")
			.values({
				entity_id: "wrong_entity",
				schema_key: "schema1",
				file_id: "file1.json",
				label_id: label.id,
			})
			.execute()
	).rejects.toThrow(/Foreign key constraint violation/);

	// Try with wrong schema_key - should fail
	await expect(
		lix.db
			.insertInto("entity_label")
			.values({
				entity_id: "entity1",
				schema_key: "wrong_schema",
				file_id: "file1.json",
				label_id: label.id,
			})
			.execute()
	).rejects.toThrow(/Foreign key constraint violation/);

	// Try with wrong file_id - should fail
	await expect(
		lix.db
			.insertInto("entity_label")
			.values({
				entity_id: "entity1",
				schema_key: "schema1",
				file_id: "wrong_file.json",
				label_id: label.id,
			})
			.execute()
	).rejects.toThrow(/Foreign key constraint violation/);

	// With all correct values - should succeed
	await expect(
		lix.db
			.insertInto("entity_label")
			.values({
				entity_id: "entity1",
				schema_key: "schema1",
				file_id: "file1.json",
				label_id: label.id,
			})
			.execute()
	).resolves.not.toThrow();
});
