import { prosemirrorFile, lix } from "./state";
import {
	changeIsLeaf,
	changeIsLeafInVersion,
	changeSetIsAncestorOf,
	ChangeSet,
	changeSetElementInSymmetricDifference,
	changeSetHasLabel,
	createChangeSet,
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
	Array<ChangeSet & { change_count: number; created_at: string }>
> {
	// First get the current version's change set
	const activeVersion = await selectActiveVersion();

	// Then select checkpoints that are ancestors of the current version's change set
	const result = await lix.db
		.selectFrom("change_set")
		.where(changeSetHasLabel("checkpoint"))
		.where(changeSetIsAncestorOf({ id: activeVersion.change_set_id }))
		.innerJoin(
			"change_set_element",
			"change_set.id",
			"change_set_element.change_set_id",
		)
		.innerJoin("change", "change_set_element.change_id", "change.id")
		.where("change.schema_key", "=", "lix_change_set_table")
		.selectAll("change_set")
		.select("change.created_at")
		.select((eb) => [
			eb.fn.count<number>("change_set_element.change_id").as("change_count"),
		])
		// group by is needed to not make sql aggregate the change_count into one row
		.groupBy("change_set.id")
		.orderBy("change.created_at", "desc")
		.execute();

	// need to filter out the count
	return result.filter((checkpoint) => checkpoint.id !== null);
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
 * Count changes in a change set
 */
export async function countChangesInChangeSet(
	changeSetId: string,
): Promise<number> {
	try {
		const result = await lix.db
			.selectFrom("change_set_element")
			.innerJoin("change", "change_set_element.change_id", "change.id")
			.where("change_set_element.change_set_id", "=", changeSetId)
			.groupBy(["change.entity_id", "change.schema_key", "change.file_id"])
			.select((eb) => [
				eb.fn.count<number>("change_set_element.change_id").as("count"),
			])
			.executeTakeFirst();

		return result?.count || 0;
	} catch (error) {
		console.error("Error counting changes:", error);
		return 0;
	}
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

/**
 * Special change set which describes the current changes
 * that are not yet checkpointed.
 */
export async function selectWorkingChangeSet(): Promise<
	(ChangeSet & { change_count: number; created_at: string }) | null
> {
	try {
		const activeVersion = await selectActiveVersion();

		console.log("select working change set");

		// First find the latest checkpoint in the current version's change set graph
		const latestCheckpoint = await lix.db
			.selectFrom("change_set")
			.where(changeSetHasLabel("checkpoint"))
			.where(changeSetIsAncestorOf({ id: activeVersion.change_set_id }))
			.selectAll()
			.executeTakeFirst();

		// Get all changes that are descendants of the latest checkpoint
		// or all changes if there is no checkpoint
		const newChanges = await lix.db
			.selectFrom("change")
			.innerJoin("file", "change.file_id", "file.id")
			.where("file.id", "=", prosemirrorFile.id)
			.selectAll("change")
			.execute();

		if (newChanges.length === 0) {
			return null;
		}

		const labelName = `current:${activeVersion.id}`;

		const label = await lix.db
			.insertInto("label")
			.values({
				name: labelName,
			})
			.onConflict((oc) => oc.doUpdateSet({ name: labelName }))
			.returningAll()
			.executeTakeFirstOrThrow();

		let currentChangeSet = await lix.db
			.selectFrom("change_set")
			.innerJoin(
				"change_set_label",
				"change_set.id",
				"change_set_label.change_set_id",
			)
			.innerJoin("label", "change_set_label.label_id", "label.id")
			.where("label.name", "=", labelName)
			.selectAll("change_set")
			.executeTakeFirst();

		if (!currentChangeSet) {
			currentChangeSet = await createChangeSet({
				lix,
				changes: newChanges,
				labels: [label],
			});
		}

		if (newChanges.length > 0) {
			await lix.db
				.insertInto("change_set_element")
				.values(
					newChanges.map((c) => ({
						entity_id: c.entity_id,
						file_id: c.file_id,
						schema_key: c.schema_key,
						change_set_id: currentChangeSet.id,
						change_id: c.id,
					})),
				)
				.onConflict((oc) => oc.doNothing())
				.execute();
		}

		const changes = await lix.db
			.selectFrom("change_set_element")
			.innerJoin("change", "change_set_element.change_id", "change.id")
			.where("change_set_element.change_set_id", "=", currentChangeSet.id)
			.groupBy(["change.entity_id", "change.schema_key", "change.file_id"])
			.selectAll("change")
			.execute();

		return {
			...currentChangeSet,
			change_count: changes.length,
			created_at: changes.toSorted((a, b) =>
				b.created_at.localeCompare(a.created_at),
			)[0]?.created_at,
		};
	} catch (e) {
		console.error(e);
		throw e;
	}
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
