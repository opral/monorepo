import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { switchVersion } from "./switch-version.js";
import { createVersion } from "./create-version.js";

test("switching branches should update the current_version", async () => {
	const lix = await openLixInMemory({});

	const currentVersion = await lix.db
		.selectFrom("current_version")
		.innerJoin("version", "current_version.id", "version.id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	const newBranch = await lix.db.transaction().execute(async (trx) => {
		const newBranch = await createVersion({
			lix: { db: trx },
			parent: currentVersion,
		});
		await switchVersion({ lix: { db: trx }, to: newBranch });
		return newBranch;
	});

	const currentVersionAfterSwitch = await lix.db
		.selectFrom("current_version")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(currentVersionAfterSwitch.id).toBe(newBranch?.id);
});
