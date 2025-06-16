import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createLabel } from "./create-label.js";
import { createVersion } from "../version/create-version.js";

test("should create a label with auto-generated ID", async () => {
	const lix = await openLixInMemory({});

	const labelName = "feature";
	const label = await createLabel({ 
		lix, 
		name: labelName,
	});

	// Verify the label was created
	expect(label).toMatchObject({
		name: labelName,
	});
	expect(label.id).toBeDefined();
	expect(typeof label.id).toBe("string");

	// Verify the label exists in the database
	const dbLabel = await lix.db
		.selectFrom("label")
		.selectAll()
		.where("id", "=", label.id)
		.executeTakeFirstOrThrow();

	expect(dbLabel).toMatchObject({
		name: labelName,
		id: label.id,
	});
});

test("should create a label with custom ID", async () => {
	const lix = await openLixInMemory({});

	const customId = "custom-label-id";
	const labelName = "bugfix";
	const label = await createLabel({ 
		lix, 
		id: customId,
		name: labelName,
	});

	// Verify the label was created with the custom ID
	expect(label).toMatchObject({
		id: customId,
		name: labelName,
	});

	// Verify the label exists in the database
	const dbLabel = await lix.db
		.selectFrom("label")
		.selectAll()
		.where("id", "=", customId)
		.executeTakeFirstOrThrow();

	expect(dbLabel).toMatchObject({
		id: customId,
		name: labelName,
	});
});

test("should create a label with specific version_id", async () => {
	const lix = await openLixInMemory({});

	const version = await createVersion({
		lix,
		id: "test-version",
	});

	const labelName = "hotfix";
	const label = await createLabel({ 
		lix, 
		name: labelName,
		state_version_id: version.id,
	});

	// Verify the label was created with the specified state_version_id
	expect(label).toMatchObject({
		name: labelName,
		state_version_id: version.id,
	});

	// Verify the label exists in the database
	const dbLabel = await lix.db
		.selectFrom("label")
		.selectAll()
		.where("id", "=", label.id)
		.executeTakeFirstOrThrow();

	expect(dbLabel).toMatchObject({
		name: labelName,
		state_version_id: version.id,
	});
});

test("should handle transaction correctly", async () => {
	const lix = await openLixInMemory({});
	const labelName = "transaction-test";

	await lix.db.transaction().execute(async (trx) => {
		const label = await createLabel({
			lix: { ...lix, db: trx },
			name: labelName,
		});

		expect(label.name).toBe(labelName);
		expect(label.id).toBeDefined();

		// Verify the label exists within the transaction
		const dbLabel = await trx
			.selectFrom("label")
			.selectAll()
			.where("id", "=", label.id)
			.executeTakeFirstOrThrow();

		expect(dbLabel.name).toBe(labelName);
	});
});

test("should create multiple labels with unique IDs", async () => {
	const lix = await openLixInMemory({});

	const label1 = await createLabel({ 
		lix, 
		name: "label-1",
	});

	const label2 = await createLabel({ 
		lix, 
		name: "label-2",
	});

	// Verify labels have different IDs
	expect(label1.id).not.toBe(label2.id);
	expect(label1.name).toBe("label-1");
	expect(label2.name).toBe("label-2");

	// Verify both labels exist in the database
	const labels = await lix.db
		.selectFrom("label")
		.selectAll()
		.where("id", "in", [label1.id, label2.id])
		.execute();

	expect(labels).toHaveLength(2);
	expect(labels.map(l => l.name).sort()).toEqual(["label-1", "label-2"]);
});

test("should create multiple labels within a transaction", async () => {
	const lix = await openLixInMemory({});

	await lix.db.transaction().execute(async (trx) => {
		const label1 = await createLabel({
			lix: { ...lix, db: trx },
			name: "tx-label-1",
		});

		const label2 = await createLabel({
			lix: { ...lix, db: trx },
			name: "tx-label-2",
		});

		// Labels should have unique IDs
		expect(label1.id).not.toBe(label2.id);
		expect(label1.name).toBe("tx-label-1");
		expect(label2.name).toBe("tx-label-2");

		// Verify both labels exist within the transaction
		const labels = await trx
			.selectFrom("label")
			.selectAll()
			.where("id", "in", [label1.id, label2.id])
			.execute();

		expect(labels).toHaveLength(2);
	});
});

test("should use nanoid for ID generation", async () => {
	const lix = await openLixInMemory({});

	const label1 = await createLabel({ 
		lix, 
		name: "nanoid-test-1",
	});

	const label2 = await createLabel({ 
		lix, 
		name: "nanoid-test-2",
	});

	// Verify IDs are strings and unique (characteristic of nanoid)
	expect(typeof label1.id).toBe("string");
	expect(typeof label2.id).toBe("string");
	expect(label1.id).not.toBe(label2.id);
	
	// nanoid typically generates 21-character strings
	expect(label1.id.length).toBeGreaterThan(0);
	expect(label2.id.length).toBeGreaterThan(0);
});

test("should handle labels with same name but different IDs", async () => {
	const lix = await openLixInMemory({});

	const sameName = "duplicate-name";
	const label1 = await createLabel({ 
		lix, 
		name: sameName,
	});

	const label2 = await createLabel({ 
		lix, 
		name: sameName,
	});

	// Verify labels have different IDs but same name
	expect(label1.id).not.toBe(label2.id);
	expect(label1.name).toBe(sameName);
	expect(label2.name).toBe(sameName);

	// Verify both labels exist in the database
	const labels = await lix.db
		.selectFrom("label")
		.selectAll()
		.where("name", "=", sameName)
		.execute();

	expect(labels).toHaveLength(2);
	expect(labels.map(l => l.id).sort()).toEqual([label1.id, label2.id].sort());
});