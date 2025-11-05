import { ebEntity, jsonArrayFrom, type Lix } from "@lix-js/sdk";

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
	// Select commits with checkpoint label and their associated change sets
	return (
		lix.db
			.selectFrom("commit")
			.innerJoin("change_set", "change_set.id", "commit.change_set_id")
			.where(ebEntity("commit").hasLabel({ name: "checkpoint" }))
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
			.orderBy("change_set.lixcol_updated_at", "desc")
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
		.selectFrom("active_account as aa")
		.innerJoin("account_by_version as a", "a.id", "aa.account_id")
		.where("a.lixcol_version_id", "=", "global")
		.select(["aa.account_id", "a.id", "a.name"]);
}

export function selectMainVersion(lix: Lix) {
	return lix.db.selectFrom("version").where("name", "=", "main").selectAll();
}

export function selectConversations(
	lix: Lix,
	args: { commitId: string },
) {
	return lix.db
		.selectFrom("conversation")
		.leftJoin(
			"entity_conversation",
			"conversation.id",
			"entity_conversation.conversation_id",
		)
		.where("entity_conversation.entity_id", "=", args.commitId)
		.where("entity_conversation.schema_key", "=", "lix_commit")
		.where("entity_conversation.file_id", "=", "lix")
		.select((eb) => [
			jsonArrayFrom(
				eb
					.selectFrom("conversation_message")
					.innerJoin(
						"change_author",
						"conversation_message.lixcol_change_id",
						"change_author.change_id",
					)
					.innerJoin("account", "account.id", "change_author.account_id")
					.select([
						"conversation_message.id",
						"conversation_message.body",
						"conversation_message.conversation_id",
						"conversation_message.parent_id",
						"conversation_message.lixcol_created_at",
						"conversation_message.lixcol_updated_at",
					])
					.select("account.name as author_name")
					.orderBy("conversation_message.lixcol_created_at", "asc")
					.whereRef(
						"conversation_message.conversation_id",
						"=",
						"conversation.id",
					),
			).as("comments"),
		])
		.selectAll("conversation");
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
					.innerJoin("commit", "version.working_commit_id", "commit.id")
					.select("commit.change_set_id"),
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
