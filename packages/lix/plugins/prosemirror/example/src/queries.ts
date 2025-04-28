import { prosemirrorFile, lix } from "./state";
import {
	changeSetIsAncestorOf,
	ChangeSet,
	changeSetHasLabel,
	jsonArrayFrom,
} from "@lix-js/sdk";

/**
 * Selects the current prosemirror document from the lix database
 */
export async function selectProsemirrorDocument() {
	const file = await lix.db
		.selectFrom("file")
		.where("id", "=", prosemirrorFile.id)
		.selectAll()
		.executeTakeFirst();

	if (file?.data) {
		try {
			return JSON.parse(new TextDecoder().decode(file.data));
		} catch (err) {
			console.error("Error parsing document:", err);
			return null;
		}
	}

	return null;
}

/**
 * Selects all changes related to the prosemirror document
 */
export async function selectChanges() {
	const result = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
		.innerJoin("file", "change.file_id", "file.id")
		.where("file.id", "=", prosemirrorFile.id)
		.selectAll("change")
		.select("snapshot.content")
		.orderBy("change.created_at", "desc")
		.execute();

	// console.log({ result });
	return result;
}

export async function selectCheckpoints(): Promise<
	Array<ChangeSet & { change_count: number }>
> {
	// First get the current version's change set
	const activeVersion = await selectActiveVersion();

	// Then select checkpoints that are ancestors of the current version's change set
	return await lix.db
		.selectFrom("change_set")
		.where(changeSetHasLabel({ name: "checkpoint" }))
		.where(
			changeSetIsAncestorOf(
				{ id: activeVersion.change_set_id },
				// in case the checkpoint is the active version's change set
				{ includeSelf: true },
			),
		)
		// left join in case the change set has no elements
		.leftJoin(
			"change_set_element",
			"change_set.id",
			"change_set_element.change_set_id",
		)
		.where("file_id", "=", prosemirrorFile.id)
		.selectAll("change_set")
		.groupBy("change_set.id")
		.select((eb) => [
			eb.fn.count<number>("change_set_element.change_id").as("change_count"),
		])
		.select((eb) =>
			eb
				.selectFrom("change")
				.where("change.schema_key", "=", "lix_change_set_table")
				.whereRef("change.entity_id", "=", "change_set.id")
				.select("change.created_at")
				.as("created_at"),
		)
		.orderBy("created_at", "desc")
		.execute();
}

/**
 * Selects open change proposals from the database
 */
// export async function selectOpenChangeProposals() {
// 	return lix.db
// 		.selectFrom("change_proposal")
// 		.innerJoin("change", "change.entity_id", "change_proposal.id")
// 		.innerJoin("change_author", "change_author.change_id", "change.id")
// 		.innerJoin("account", "account.id", "change_author.account_id")
// 		.selectAll("change_proposal")
// 		.select("account.name as account_name")
// 		.innerJoin("change_set", "change_set.id", "change_proposal.change_set_id")
// 		.innerJoin(
// 			"change_set_element",
// 			"change_set_element.change_set_id",
// 			"change_set.id",
// 		)
// 		.select((eb) => [
// 			eb.fn.count<number>("change_set_element.change_id").as("change_count"),
// 		])
// 		.groupBy("change_proposal.id")
// 		.execute();
// }

/**
 * Selects all versions
 */
export async function selectVersions() {
	return lix.db.selectFrom("version").selectAll().execute();
}

/**
 * Selects the current version
 */
export async function selectActiveVersion() {
	return lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.selectAll("version")
		.executeTakeFirstOrThrow();
}

/**
 * Selects the current active account
 */
export async function selectActiveAccount() {
	return lix.db
		.selectFrom("active_account")
		.innerJoin("account", "active_account.id", "account.id")
		.selectAll()
		.executeTakeFirst();
}

export async function selectMainVersion() {
	return lix.db
		.selectFrom("version")
		.where("name", "=", "main")
		.selectAll()
		.executeTakeFirstOrThrow();
}

export async function selectThreads(args: { changeSetId: ChangeSet["id"] }) {
	return await lix.db
		.selectFrom("thread")
		.leftJoin("change_set_thread", "thread.id", "change_set_thread.thread_id")
		.where("change_set_thread.change_set_id", "=", args.changeSetId)
		.select((eb) => [
			jsonArrayFrom(
				eb
					.selectFrom("thread_comment")
					.innerJoin("change", "change.entity_id", "thread_comment.id")
					.innerJoin("change_author", "change_author.change_id", "change.id")
					.innerJoin("account", "account.id", "change_author.account_id")
					.select([
						"thread_comment.id",
						"thread_comment.body",
						"thread_comment.thread_id",
						"thread_comment.parent_id",
					])
					.select(["change.created_at", "account.name as author_name"])
					.whereRef("thread_comment.thread_id", "=", "thread.id"),
			).as("comments"),
		])
		.selectAll("thread")
		.execute();
}

/**
 * Special change set which describes the current changes
 * that are not yet checkpointed.
 */
export async function selectWorkingChangeSet(): Promise<
	(ChangeSet & { change_count: number }) | undefined
> {
	const activeVersion = await selectActiveVersion();

	return await lix.db
		.selectFrom("change_set")
		.where("id", "=", activeVersion.working_change_set_id)
		// left join in case the change set has no elements
		.leftJoin(
			"change_set_element",
			"change_set.id",
			"change_set_element.change_set_id",
		)
		.where("file_id", "=", prosemirrorFile.id)
		.selectAll("change_set")
		.groupBy("change_set.id")
		.select((eb) => [
			eb.fn.count<number>("change_set_element.change_id").as("change_count"),
		])
		.executeTakeFirst();
}
