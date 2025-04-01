import type { Lix } from "../lix/index.js";
import type { ChangeSet } from "./database-schema.js";
import { changeIsLeafV2 } from "../query-filter/change-is-leaf-v2.js";
import { applyChangeSet } from "./apply-change-set.js";
import { createChangeSet } from "./create-change-set.js";
import type { Version } from "../database/schema.js";

export async function restoreChangeSet(args: {
	lix: Lix;
	changeSet: Pick<ChangeSet, "id">;
	version?: Pick<Version, "id">;
}): Promise<void> {
	const executeInTransaction = async (trx: Lix["db"]) => {
		const version =
			args.version ??
			(await trx
				.selectFrom("active_version")
				.select(["id"])
				.executeTakeFirstOrThrow());
		const changesToRestore = await trx
			.selectFrom("change")
			.innerJoin(
				"change_set_element",
				"change_set_element.change_id",
				"change.id"
			)
			.where(changeIsLeafV2(args.changeSet.id, { mode: { type: "direct" } }))
			.selectAll()
			.execute();

		const interimChangeSet = await createChangeSet({
			lix: { ...args.lix, db: trx },
			changes: changesToRestore,
		});

		await applyChangeSet({
			lix: { ...args.lix, db: trx },
			changeSet: interimChangeSet,
			mode: { type: "direct" },
		});

		await trx
			.updateTable("version_v2")
			.set({ change_set_id: args.changeSet.id })
			.where("id", "=", version.id)
			.execute();

		await trx
			.deleteFrom("change_set")
			.where("id", "=", interimChangeSet.id)
			.execute();
	};

	if (args.lix.db.isTransaction) {
		return executeInTransaction(args.lix.db);
	} else {
		return args.lix.db.transaction().execute(executeInTransaction);
	}
}
