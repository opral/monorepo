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
		.insertInto("change_proposal_all")
		.values({
			source_version_id: src.id,
			target_version_id: tgt.id,
			lixcol_version_id: "global",
		})
		.execute();

	const inserted = await lix.db
		.selectFrom("change_proposal")
		.selectAll()
		.orderBy("lixcol_created_at", "desc")
		.limit(1)
		.executeTakeFirstOrThrow();

	expect(inserted.status).toBe("open");
	expect(inserted.source_version_id).toBe(src.id);
	expect(inserted.target_version_id).toBe(tgt.id);

	// 2) Verify tracked (not untracked) via _all view
	const insertedAll = await lix.db
		.selectFrom("change_proposal_all")
		.where("id", "=", inserted.id)
		.selectAll()
		.executeTakeFirstOrThrow();
	expect(insertedAll.lixcol_untracked).toBe(0);
	expect(insertedAll.lixcol_version_id).toBe("global");

	// 3) Update status
	await lix.db
		.updateTable("change_proposal_all")
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
		.deleteFrom("change_proposal_all")
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
