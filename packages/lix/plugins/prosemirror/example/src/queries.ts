import { prosemirrorFile, lix } from "./state";
import {
	changeIsLeaf,
	changeIsLeafInVersion,
	changeSetIsAncestorOf,
	ChangeSet,
	changeSetElementInSymmetricDifference,
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
export async function selectOpenChangeProposals() {
	return lix.db
		.selectFrom("change_proposal")
		.innerJoin("change", "change.entity_id", "change_proposal.id")
		.innerJoin("change_author", "change_author.change_id", "change.id")
		.innerJoin("account", "account.id", "change_author.account_id")
		.selectAll("change_proposal")
		.select("account.name as account_name")
		.innerJoin("change_set", "change_set.id", "change_proposal.change_set_id")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_set_id",
			"change_set.id",
		)
		.select((eb) => [
			eb.fn.count<number>("change_set_element.change_id").as("change_count"),
		])
		.groupBy("change_proposal.id")
		.execute();
}

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
		.innerJoin("version_v2", "active_version.version_id", "version_v2.id")
		.selectAll("version_v2")
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

export async function selectDiscussion(args: { changeSetId: ChangeSet["id"] }) {
	return await lix.db
		.selectFrom("discussion")
		.where("change_set_id", "=", args.changeSetId)
		.select((eb) => [
			jsonArrayFrom(
				eb
					.selectFrom("comment")
					.select(["comment.content", "comment.id", "comment.discussion_id"])
					.innerJoin("change", "change.entity_id", "comment.id")
					.innerJoin("change_author", "change_author.change_id", "change.id")
					.innerJoin("account", "account.id", "change_author.account_id")
					.select(["change.created_at", "account.name as author_name"])
					.whereRef("comment.discussion_id", "=", "discussion.id"),
			).as("comments"),
		])
		.selectAll("discussion")
		.executeTakeFirst();
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

/**
 * Selects the current change proposal (if not in main version) for the sidebar
 *
 * TODO need easier API in lix
 */
export async function selectProposedChangeSet(): Promise<
	(ChangeSet & { change_count: number }) | null
> {
	const mainVersion = await selectMainVersion();
	const currentVersion = await selectActiveVersion();

	if (currentVersion.id === mainVersion.id) {
		return null;
	}

	const sourceChangeSet = await lix.db
		.insertInto("change_set")
		.values({ id: `source-${currentVersion.id}` })
		.onConflict((oc) => oc.doUpdateSet({ id: `source-${currentVersion.id}` }))
		.returningAll()
		.executeTakeFirstOrThrow();

	// always have the proposed change set available
	const proposedChangeSet = await lix.db
		.insertInto("change_set")
		.values({
			id: `proposed-${currentVersion.id}`,
		})
		.onConflict((oc) => oc.doUpdateSet({ id: `proposed-${currentVersion.id}` }))
		.returningAll()
		.executeTakeFirstOrThrow();

	const targetChangeSet = await lix.db
		.insertInto("change_set")
		.values({
			id: `target-${currentVersion.id}`,
		})
		.onConflict((oc) => oc.doUpdateSet({ id: `target-${currentVersion.id}` }))
		.returningAll()
		.executeTakeFirstOrThrow();

	// using the current change set as the source
	const sourceChanges = await lix.db
		.selectFrom("change")
		.innerJoin("file", "change.file_id", "file.id")
		.where("file.id", "=", prosemirrorFile.id)
		.where(changeIsLeafInVersion(currentVersion))
		.select([
			"change.id",
			"change.entity_id",
			"change.file_id",
			"change.schema_key",
		])
		.execute();

	// getting all changes of main to use as target
	// todo need to target the current change set of main instead
	// todo but that requires the change_set_graph to be implemented
	// of re-creating the change set all the time
	const targetChanges = await lix.db
		.selectFrom("change")
		.innerJoin("file", "change.file_id", "file.id")
		.where("file.id", "=", prosemirrorFile.id)
		.where(changeIsLeafInVersion(mainVersion))
		.select([
			"change.id",
			"change.entity_id",
			"change.file_id",
			"change.schema_key",
		])
		.execute();

	// add all source changes
	await lix.db
		.insertInto("change_set_element")
		.values(
			sourceChanges.map((c) => ({
				change_set_id: sourceChangeSet.id,
				change_id: c.id,
				entity_id: c.entity_id,
				file_id: c.file_id,
				schema_key: c.schema_key,
			})),
		)
		.onConflict((oc) => oc.doNothing())
		.execute();

	// add all target changes
	await lix.db
		.insertInto("change_set_element")
		.values(
			targetChanges.map((c) => ({
				change_set_id: targetChangeSet.id,
				change_id: c.id,
				entity_id: c.entity_id,
				file_id: c.file_id,
				schema_key: c.schema_key,
			})),
		)
		.onConflict((oc) => oc.doNothing())
		.execute();

	const proposedChanges = await lix.db
		.selectFrom("change_set_element")
		.innerJoin("change", "change_set_element.change_id", "change.id")
		.where(
			changeSetElementInSymmetricDifference(sourceChangeSet!, targetChangeSet),
		)
		// The symmetric difference alone is not enough
		// which change came before and after?
		// if the source has leafs that are new,
		.where(changeIsLeaf())
		.distinct()
		.select([
			"change_id as id",
			"change.entity_id",
			"change.file_id",
			"change.schema_key",
		])
		.execute();

	if (proposedChanges.length > 0) {
		// always keep the proposal up to date. this demo
		// is purposefully simple by encouraging short lived
		// proposals that dont run out of sync with the main
		// version
		await lix.db
			.insertInto("change_set_element")
			.values(
				proposedChanges.map((c) => ({
					change_set_id: proposedChangeSet.id,
					change_id: c.id,
					entity_id: c.entity_id,
					file_id: c.file_id,
					schema_key: c.schema_key,
				})),
			)
			.onConflict((oc) => oc.doNothing())
			.execute();
	}

	return {
		...proposedChangeSet,
		change_count: proposedChanges.length,
	};
}
