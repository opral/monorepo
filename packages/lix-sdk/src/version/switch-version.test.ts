import { expect, test } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import { createVersion } from "./create-version.js";
import { switchVersion } from "./switch-version.js";

// todo needs global state/version feature
test.todo("switching versiones should update the active_version", async () => {
	const lix = await openLixInMemory({});

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	const newVersion = await lix.db.transaction().execute(async (trx) => {
		const newVersion = await createVersion({
			lix: { ...lix, db: trx },
			changeSet: { id: activeVersion.change_set_id },
		});
		await switchVersion({ lix: { ...lix, db: trx }, to: newVersion });
		return newVersion;
	});

	const activeVersionAfterSwitch = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.selectAll("version")
		.executeTakeFirstOrThrow();

	expect(activeVersionAfterSwitch.id).toBe(newVersion?.id);
});
