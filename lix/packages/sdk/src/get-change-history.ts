import { Kysely } from "kysely";
import type { LixDatabase } from "./schema.js";

export async function getChangeHistory({
	atomId,
	depth,
	fileId,
	pluginKey,
	diffType,
	db,
}: {
	atomId: string;
	depth: number;
	fileId: string;
	pluginKey: string;
	diffType: string;
	db: Kysely<LixDatabase>;
}): Promise<any[]> {
	if (depth > 1) {
		// TODO: walk change parents until depth
		throw new Error("depth > 1 not supported yet");
	}

	const { commit_id } = await db
		.selectFrom("ref")
		.select("commit_id")
		.where("name", "=", "current")
		.executeTakeFirstOrThrow();

	let nextCommitId = commit_id;
	let firstChange;
	while (!firstChange && nextCommitId) {
		const commit = await db
			.selectFrom("commit")
			.selectAll()
			.where("id", "=", nextCommitId)
			.executeTakeFirst();

		if (!commit) {
			break;
		}
		nextCommitId = commit.parent_id;

		firstChange = await db
			.selectFrom("change")
			.selectAll()
			.where("commit_id", "=", commit.id)
			.where((eb) => eb.ref("value", "->>").key("id"), "=", atomId)
			.where("plugin_key", "=", pluginKey)
			.where("file_id", "=", fileId)
			.where("type", "=", diffType)
			.executeTakeFirst();
	}

	const changes: any[] = [firstChange];

	return changes;
}
