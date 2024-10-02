import { BranchExistsError } from "./errors.js";
import type { initDb } from "../database/initDb.js";

export async function createBranch(args: {
	db: ReturnType<typeof initDb>;
	name: string;
	branchId?: string;
}): Promise<string> {
	let branchId: string;

	await args.db.transaction().execute(async (trx) => {
		const currentBranch = await trx
			.selectFrom("branch")
			.select("id")
			.where("active", "=", true)
			.executeTakeFirstOrThrow();

		const existing = await trx
			.selectFrom("branch")
			.where("name", "=", args.name)
			.select("id")
			.executeTakeFirst();

		if (existing) {
			throw new BranchExistsError({ name: args.name, id: existing.id });
		}

		const newBranch = await trx
			.insertInto("branch")
			.values({
				name: args.name,
				active: false,
				base_branch: currentBranch.id,
				id: args.branchId || undefined,
			})
			.returning("id")
			.executeTakeFirstOrThrow();

		branchId = newBranch.id;

		await trx
			.insertInto("branch_change")
			.columns(["id", "branch_id", "change_id", "seq"])
			.expression((eb) =>
				eb
					.selectFrom("branch_change")
					.select((eb) => [
						"branch_change.id",
						eb.val(newBranch!.id).as("branch_id"),
						"branch_change.change_id",
						"branch_change.seq",
					])
					.where("branch_id", "=", currentBranch.id),
			)
			.execute();
	});

	return branchId!;
}
