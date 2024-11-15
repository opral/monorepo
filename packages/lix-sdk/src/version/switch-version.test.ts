import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { switchVersion } from "./switch-version.js";
import { createVersion } from "./create-version.js";

test("switching versiones should update the current_version", async () => {
	const lix = await openLixInMemory({});

	const currentVersion = await lix.db
		.selectFrom("current_version")
		.innerJoin("version", "current_version.id", "version.id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	const newVersion = await lix.db.transaction().execute(async (trx) => {
		const newVersion = await createVersion({
			lix: { db: trx },
			parent: currentVersion,
		});
		await switchVersion({ lix: { db: trx }, to: newVersion });
		return newVersion;
	});

	const currentVersionAfterSwitch = await lix.db
		.selectFrom("current_version")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(currentVersionAfterSwitch.id).toBe(newVersion?.id);
});
