import {
	ChangeSet,
	changeSetHasLabel,
	jsonArrayFrom,
	type Lix,
} from "@lix-js/sdk";

// Helper to get the prosemirror file ID
export const selectFileId = (lix: Lix) =>
	lix.db
		.selectFrom("file")
		.where("path", "=", "/prosemirror.json")
		.select("id");

/**
 * Selects the current prosemirror document from the lix database
 */
export function selectProsemirrorDoc(lix: Lix) {
	return lix.db
		.selectFrom("file")
		.where("id", "=", selectFileId(lix))
		.selectAll();
}

/**
 * Selects all changes related to the prosemirror document
 */
export function selectChanges(lix: Lix) {
	return lix.db
		.selectFrom("change")
		.innerJoin("file", "change.file_id", "file.id")
		.where("file.id", "=", selectFileId(lix))
		.selectAll("change")
		.orderBy("change.created_at", "desc");
}

export function selectCheckpoints(lix: Lix) {
	// This function needs to work with the changeSetIsAncestorOf helper
	// For now, let's simplify it to just get checkpoints
	return (
		lix.db
			.selectFrom("change_set")
			.where(changeSetHasLabel({ name: "checkpoint" }))
			// left join in case the change set has no elements
			.leftJoin(
				"change_set_element",
				"change_set.id",
				"change_set_element.change_set_id",
			)
			.where("file_id", "=", selectFileId(lix))
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
	);
}

/**
 * Selects open change proposals from the database
 */
// export function selectOpenChangeProposals(lix: Lix) {
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
// 		.groupBy("change_proposal.id");
// }

/**
 * Selects all versions
 */
export function selectVersions(lix: Lix) {
	return lix.db.selectFrom("version").selectAll().where("hidden", "=", false);
}

/**
 * Selects the current version
 */
export function selectActiveVersion(lix: Lix) {
	return lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.selectAll("version");
}

/**
 * Selects the current active account
 */
export function selectActiveAccount(lix: Lix) {
	return lix.db
		.selectFrom("active_account")
		.innerJoin("account", "active_account.id", "account.id")
		.selectAll();
}

export function selectMainVersion(lix: Lix) {
	return lix.db.selectFrom("version").where("name", "=", "main").selectAll();
}

export function selectThreads(
	lix: Lix,
	args: { changeSetId: ChangeSet["id"] },
) {
	return lix.db
		.selectFrom("thread")
		.leftJoin("change_set_thread", "thread.id", "change_set_thread.thread_id")
		.where("change_set_thread.change_set_id", "=", args.changeSetId)
		.select((eb) => [
			jsonArrayFrom(
				eb
					.selectFrom("thread_comment")
					// .innerJoin("account", "account.id", "change_author.account_id")
					.select([
						"thread_comment.id",
						"thread_comment.body",
						"thread_comment.thread_id",
						"thread_comment.parent_id",
						"thread_comment.lixcol_created_at",
						"thread_comment.lixcol_updated_at",
					])
					.select((eb) => eb.val("TODO username").as("author_name"))
					.whereRef("thread_comment.thread_id", "=", "thread.id"),
			).as("comments"),
		])
		.selectAll("thread");
}

/**
 * Special change set which describes the current changes
 * that are not yet checkpointed.
 */
export function selectWorkingChangeSet(lix: Lix) {
	return (
		lix.db
			.selectFrom("change_set")
			.where(
				"id",
				"=",
				lix.db
					.selectFrom("active_version")
					.innerJoin("version", "active_version.version_id", "version.id")
					.select("version.working_change_set_id"),
			)
			// left join in case the change set has no elements
			.leftJoin(
				"change_set_element",
				"change_set.id",
				"change_set_element.change_set_id",
			)
			.where("file_id", "=", selectFileId(lix))
			.selectAll("change_set")
			.groupBy("change_set.id")
			.select((eb) => [
				eb.fn.count<number>("change_set_element.change_id").as("change_count"),
			])
	);
}
