import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import type { VersionChange } from "../database/schema.js";
import { mockChange } from "../change/mock-change.js";
import { createVersion } from "../version/create-version.js";
import { versionChangeInDifference } from "./version-change-in-difference.js";

test("should return the difference between two versions", async () => {
	const lix = await openLixInMemory({});

	const versionA = await createVersion({ lix });
	const versionB = await createVersion({ lix });

	await lix.db
		.insertInto("change")
		.values([
			mockChange({ id: "change1" }),
			mockChange({ id: "change2" }),
			mockChange({ id: "change3" }),
			mockChange({ id: "change4" }),
		])
		.returningAll()
		.execute();

	const changesA: VersionChange[] = [
		{ version_id: versionA.id, change_id: "change1" },
		{ version_id: versionA.id, change_id: "change2" },
	];

	const changesB: VersionChange[] = [
		{ version_id: versionB.id, change_id: "change2" },
		{ version_id: versionB.id, change_id: "change3" },
	];

	await lix.db
		.insertInto("version_change")
		.values([...changesA, ...changesB])
		.execute();

	const result = await lix.db
		.selectFrom("version_change")
		.where(versionChangeInDifference(versionA, versionB))
		.selectAll()
		.execute();

	expect(result).toEqual([
		// change1 is in A but not in B
		{ version_id: versionA.id, change_id: "change1" },
	] satisfies VersionChange[]);
});

test("should return an empty array if there are no differences", async () => {
	const lix = await openLixInMemory({});

	const versionA = await createVersion({ lix });
	const versionB = await createVersion({ lix });

	await lix.db
		.insertInto("change")
		.values([mockChange({ id: "change1" }), mockChange({ id: "change2" })])
		.returningAll()
		.execute();

	const changes: VersionChange[] = [
		{ version_id: versionA.id, change_id: "change1" },
		{ version_id: versionA.id, change_id: "change2" },
		{ version_id: versionB.id, change_id: "change1" },
		{ version_id: versionB.id, change_id: "change2" },
	];

	await lix.db.insertInto("version_change").values(changes).execute();

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
