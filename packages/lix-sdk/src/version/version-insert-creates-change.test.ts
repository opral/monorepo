import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createChangeSet } from "../change-set/create-change-set.js";
import { uuidV7, nanoId } from "../deterministic/index.js";

test("insertInto('version') creates a global lix_version change", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	// Read current global tip to use as the new version's base commit
	const globalV = await lix.db
		.selectFrom("version")
		.where("id", "=", "global")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Create a working commit for the new version (so FK/uniques are satisfied)
	const cs = await createChangeSet({ lix, lixcol_version_id: "global" });
	const workingCommitId = uuidV7({ lix });
	await lix.db
		.insertInto("commit_all")
		.values({
			id: workingCommitId,
			change_set_id: cs.id,
			lixcol_version_id: "global",
		})
		.execute();

	const newVersionId = nanoId({ lix });
	const newVersionName = "test-version-insert";

	// Act: insert the version via the entity view (vtable path)
	await lix.db
		.insertInto("version")
		.values({
			id: newVersionId,
			name: newVersionName,
			commit_id: globalV.commit_id,
			working_commit_id: workingCommitId,
			inherits_from_version_id: "global",
		})
		.execute();

	// Assert: a corresponding change row exists for this version under the change log
	const versionChanges = await lix.db
		.selectFrom("change")
		.where("schema_key", "=", "lix_version")
		.where("entity_id", "=", newVersionId)
		.selectAll()
		.execute();

	// Console diagnostics

	// Check materializer version tips for the new version
	const tips =
		(lix.sqlite.exec({
			sql: `SELECT version_id, tip_commit_id FROM internal_materialization_version_tips WHERE version_id = ?`,
			bind: [newVersionId],
			rowMode: "object",
			returnValue: "resultRows",
		}) as Array<{ version_id: string; tip_commit_id: string }>) ?? [];

	// The tip should be the commit we pointed the version to
	expect(tips.length).toBe(1);
	expect(tips[0]!.tip_commit_id).toBe(globalV.commit_id);

	expect(versionChanges.length).toBeGreaterThanOrEqual(1);
});
