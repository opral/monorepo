import { test, expect } from "vitest";
import { openLixInMemory } from "../open/openLixInMemory.js";
import { switchBranch } from "./switch-branch.js";
import { createBranch } from "./create-branch.js";

test("switching branches should update the branch pointer", async () => {
	const lix = await openLixInMemory({});

	const mainBranch = await lix.db
		.selectFrom("branch")
		.selectAll()
		.where("name", "=", "main")
		.executeTakeFirstOrThrow();

	const newBranch = await lix.db.transaction().execute(async (trx) => {
		const newBranch = await createBranch({
			lix: { db: trx },
			from: mainBranch,
		});
		await switchBranch({ lix: { db: trx }, to: newBranch });
		return newBranch;
	});

	const currentBranch = await lix.db
		.selectFrom("current_branch")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(currentBranch.id).toBe(newBranch?.id);
});
