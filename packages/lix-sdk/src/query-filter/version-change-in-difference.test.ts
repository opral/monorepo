import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import type { VersionChange } from "../database/schema.js";
import { mockChange } from "../change/mock-change.js";
import { createVersion } from "../version/create-version.js";
import { versionChangeInDifference } from "./version-change-in-difference.js";
import { updateChangesInVersion } from "../version/update-changes-in-version.js";

test("should return the difference between two versions", async () => {
	const lix = await openLixInMemory({});

	const versionA = await createVersion({ lix });
	const versionB = await createVersion({ lix });

	const mockChanges = [
		mockChange({ id: "change0", entity_id: "entity0" }),
		mockChange({ id: "change1", entity_id: "entity1" }),
		mockChange({ id: "change2", entity_id: "entity2" }),
		mockChange({ id: "change3", entity_id: "entity3" }),
	] as const;

	await lix.db
		.insertInto("change")
		.values(mockChanges)
		.returningAll()
		.execute();

	await updateChangesInVersion({
		lix,
		version: versionA,
		changes: [mockChanges[0], mockChanges[1]],
	});

	await updateChangesInVersion({
		lix,
		version: versionB,
		changes: [mockChanges[1], mockChanges[2]],
	});

	const result = await lix.db
		.selectFrom("version_change")
		.where(versionChangeInDifference(versionA, versionB))
		.select("version_id")
		.select("change_id")
		.execute();

	expect(result).toEqual([
		// change0 is in A but not in B
		expect.objectContaining({ version_id: versionA.id, change_id: "change0" }),
	] satisfies Partial<VersionChange>[]);
});

test("should return an empty array if there are no differences", async () => {
	const lix = await openLixInMemory({});

	const versionA = await createVersion({ lix });
	const versionB = await createVersion({ lix });

	const mockChanges = [
		mockChange({ id: "change0" }),
		mockChange({ id: "change1" }),
	];

	await lix.db
		.insertInto("change")
		.values(mockChanges)
		.returningAll()
		.execute();

	await updateChangesInVersion({
		lix,
		version: versionA,
		changes: mockChanges,
	});

	await updateChangesInVersion({
		lix,
		version: versionB,
		changes: mockChanges,
	});

	const result = await lix.db
		.selectFrom("version_change")
		.where(versionChangeInDifference(versionA, versionB))
		.selectAll()
		.execute();

	expect(result).toEqual([]);
});

test("should handle empty versions", async () => {
	const lix = await openLixInMemory({});

	const versionA = await createVersion({ lix });
	const versionB = await createVersion({ lix });

	const result = await lix.db
		.selectFrom("version_change")
		.where(versionChangeInDifference(versionA, versionB))
		.selectAll()
		.execute();

	// Verify the results
	expect(result).toEqual([]);
});
