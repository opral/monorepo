import type { initDb } from "../database/initDb.js";
import { getLeafChangesDiff } from "./get-leaf-changes-diff.js";
import type { LixPlugin } from "../plugin.js";
import type { Change } from "../database/schema.js";

export async function switchBranch(args: {
	plugins: LixPlugin[];
	db: ReturnType<typeof initDb>;
	branchId: string;
}) {
	await args.db.transaction().execute(async (trx) => {
		const currentBranchId = (
			await trx
				.selectFrom("branch")
				.where("active", "=", true)
				.select("id")
				.executeTakeFirstOrThrow()
		).id;

		await trx
			.updateTable("branch")
			.where("active", "=", true)
			.set({ active: false })
			.execute();

		await trx
			.updateTable("branch")
			.where("id", "=", args.branchId)
			.set({ active: true })
			.execute();

		const leafChangesDiff = await getLeafChangesDiff({
			sourceDb: trx,
			plugins: args.plugins,
			sourceBranchId: currentBranchId,
			targetBranchId: args.branchId,
		});

		const plugin = args.plugins[0];

		let changesByFileId: Record<string, typeof leafChangesDiff> = {};

		for (const { change, valueId, obsolete } of leafChangesDiff) {
			if (!changesByFileId[change.file_id]) {
				changesByFileId[change.file_id] = [];
			}
			changesByFileId[change.file_id]!.push({ change, valueId, obsolete });
		}

		for (const [fileId, changes] of Object.entries(changesByFileId)) {
			const file = await trx
				.selectFrom("file")
				.selectAll()
				.where("id", "=", fileId)
				.executeTakeFirstOrThrow();

			const { fileData } = await plugin!.applyChanges!({
				lix: { db: args.db, plugins: args.plugins },
				file,
				// @ts-ignore -- FIXME: obsolete and valueid should be handled in plugins
				changes: changes
					.filter(({ obsolete }) => !obsolete)
					.map(({ change }) => change),
				// @ts-ignore
				obsoleteChanges: changes
					.filter(({ obsolete }) => !!obsolete)
					.map(({ change }) => change),
			});

			await trx
				.updateTable("file_internal")
				.set("data", fileData!)
				.where("id", "=", file.id)
				.execute();
		}
	});
}
