import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import type { VersionChange } from "../database/schema.js";
import { mockChange } from "../change/mock-change.js";
import { createVersion } from "../version/create-version.js";
import { versionChangeInSymmetricDifference } from "./version-change-in-symmetric-difference.js";
import { updateChangesInVersion } from "../version/update-changes-in-version.js";

test("should return the symmetric difference between two versions", async () => {
	const lix = await openLixInMemory({});

	const versionA = await createVersion({ lix });
	const versionB = await createVersion({ lix });

	const mockChanges = [
		mockChange({ id: "change0", entity_id: "entity0" }),
		mockChange({ id: "change1", entity_id: "entity1" }),
		mockChange({ id: "change2", entity_id: "entity2" }),
		mockChange({ id: "change3", entity_id: "entity3" }),
	] as const;

	await lix.db.insertInto("change").values(mockChanges).execute();

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
		.where(versionChangeInSymmetricDifference(versionA, versionB))
		.selectAll()
		.execute();

	expect(result).toEqual([
		// change 0 is in A but not in B
		expect.objectContaining({ version_id: versionA.id, change_id: "change0" }),
		// change 2 is in B but not in A
		expect.objectContaining({ version_id: versionB.id, change_id: "change2" }),
		// change 3 is in neither A nor B
		// hence not in the symmetric difference
	] satisfies Partial<VersionChange>[]);
});

test("should return an empty array if there are no differences", async () => {
	const lix = await openLixInMemory({});

	const versionA = await createVersion({ lix });
	const versionB = await createVersion({ lix });

	const mockChanges = [
		mockChange({ id: "change0", entity_id: "entity0" }),
		mockChange({ id: "change1", entity_id: "entity1" }),
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
		changes: [mockChanges[0], mockChanges[1]],
	});

	const result = await lix.db
		.selectFrom("version_change")
		.where(versionChangeInSymmetricDifference(versionA, versionB))
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
		.where(versionChangeInSymmetricDifference(versionA, versionB))
		.selectAll()
		.execute();

	// Verify the results
	expect(result).toEqual([]);
});
