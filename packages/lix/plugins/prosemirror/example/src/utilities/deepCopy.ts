import { switchVersion, Version } from "@lix-js/sdk";
import { lix } from "../state";

// https://github.com/opral/lix-sdk/issues/252
export async function deepCopyChangeSet(id: string, switchToVersion: Version) {
	const changeSet = await lix.db
		.selectFrom("change_set")
		.where("id", "=", id)
		.selectAll()
		.executeTakeFirstOrThrow();

	const elements = await lix.db
		.selectFrom("change_set_element")
		.where("change_set_id", "=", id)
		.selectAll()
		.execute();

	const discussions = await lix.db
		.selectFrom("discussion")
		.where("change_set_id", "=", id)
		.selectAll()
		.execute();

	const comments = await lix.db
		.selectFrom("comment")
		.where(
			"discussion_id",
			"in",
			discussions.map((d) => d.id),
		)
		.selectAll()
		.execute();

	await switchVersion({ lix, to: switchToVersion });

	await lix.db.insertInto("change_set").values(changeSet).execute();

	if (elements.length > 0) {
		await lix.db.insertInto("change_set_element").values(elements).execute();
	}

	if (discussions.length > 0) {
		await lix.db.insertInto("discussion").values(discussions).execute();
	}

	if (comments.length > 0) {
		await lix.db.insertInto("comment").values(comments).execute();
	}
}
