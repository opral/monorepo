import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createVersion } from "../version/create-version.js";

test("insert/update/delete on change_proposal views (global, tracked)", async () => {
	const lix = await openLix({});

	// Prepare versions to reference
	const main = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();
	const src = await createVersion({ lix, from: main, name: "cp_schema_src" });
	const tgt = main; // use main as the target

	// 1) Insert (omit status to exercise default 'open')
	await lix.db
		.insertInto("change_proposal_by_version")
		.values({
			source_version_id: src.id,
			target_version_id: tgt.id,
			lixcol_version_id: "global",
		})
		.execute();

	const inserted = await lix.db
		.selectFrom("change_proposal")
		.where("source_version_id", "=", src.id)
		.where("target_version_id", "=", tgt.id)
		.orderBy("lixcol_created_at", "desc")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(inserted.status).toBe("open");
	expect(inserted.source_version_id).toBe(src.id);
	expect(inserted.target_version_id).toBe(tgt.id);

	// 2) Verify tracked (not untracked) via _all view
	const insertedAll = await lix.db
		.selectFrom("change_proposal_by_version")
		.where("id", "=", inserted.id)
		.where("lixcol_version_id", "=", "global")
		.selectAll()
		.executeTakeFirstOrThrow();
	expect(insertedAll.lixcol_untracked).toBe(0);
	expect(insertedAll.lixcol_version_id).toBe("global");

	// 3) Update status
	await lix.db
		.updateTable("change_proposal_by_version")
		.set({ status: "accepted" })
		.where("id", "=", inserted.id)
		.where("lixcol_version_id", "=", "global")
		.execute();

	const updated = await lix.db
		.selectFrom("change_proposal")
		.where("id", "=", inserted.id)
		.selectAll()
		.executeTakeFirstOrThrow();
	expect(updated.status).toBe("accepted");

	// 4) Delete
	await lix.db
		.deleteFrom("change_proposal_by_version")
		.where("id", "=", inserted.id)
		.where("lixcol_version_id", "=", "global")
		.execute();

	const afterDelete = await lix.db
		.selectFrom("change_proposal")
		.where("id", "=", inserted.id)
		.select("id")
		.executeTakeFirst();
	expect(afterDelete).toBeUndefined();
});

test("deleting a version referenced by a change proposal should fail (FK)", async () => {
	const lix = await openLix({});

	// Get main as target
	const main = await lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Create a source version from main
	const src = await createVersion({ lix, from: main, name: "cp_fk_src" });

	// Create a change proposal referencing src -> main
	await lix.db
		.insertInto("change_proposal_by_version")
		.values({
			source_version_id: src.id,
			target_version_id: main.id,
			lixcol_version_id: "global",
		})
		.execute();

	// Attempt to delete the referenced source version -> should fail due to FK
	await expect(
		lix.db.deleteFrom("version").where("id", "=", src.id).execute()
	).rejects.toThrow();

	// Cleanup: delete proposal, then deletion should succeed
	const cp = await lix.db
		.selectFrom("change_proposal")
		.where("source_version_id", "=", src.id)
		.where("target_version_id", "=", main.id)
		.selectAll()
		.executeTakeFirstOrThrow();

	await lix.db
		.deleteFrom("change_proposal_by_version")
		.where("id", "=", cp.id)
		.where("lixcol_version_id", "=", "global")
		.execute();

	await expect(
		lix.db.deleteFrom("version").where("id", "=", src.id).execute()
	).resolves.toBeDefined();
});
