import { lix } from "./state";
import {
	changeHasLabel,
	changeIsLeafInVersion,
	ChangeSet,
	ChangeProposal,
	createChangeSet,
	createChangeProposal,
	jsonArrayFrom,
} from "@lix-js/sdk";

/**
 * Selects the current prosemirror document from the lix database
 */
export async function selectProsemirrorDocument() {
	const file = await lix.db
		.selectFrom("file")
		.where("path", "=", "/prosemirror.json")
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
	return lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
		.innerJoin("file", "change.file_id", "file.id")
		.where("file.path", "=", "/prosemirror.json")
		.selectAll("change")
		.select("snapshot.content")
		.orderBy("change.created_at", "desc")
		.execute();
}

export async function selectCheckpoints(): Promise<
	Array<ChangeSet & { change_count: number; created_at: string }>
> {
	const result = await lix.db
		.selectFrom("change_set")
		.innerJoin(
			"change_set_label",
			"change_set.id",
			"change_set_label.change_set_id",
		)
		.innerJoin("label", "change_set_label.label_id", "label.id")
		.innerJoin(
			"change_set_element",
			"change_set.id",
			"change_set_element.change_set_id",
		)
		.innerJoin("change", "change_set.id", "change.entity_id")
		.where("change.schema_key", "=", "lix_change_set_table")
		.where("label.name", "=", "checkpoint")
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
		.execute();
}

/**
 * Count changes in a change set
 */
export async function countChangesInChangeSet(changeSetId: string): Promise<number> {
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
 * Creates a new change set with changes from current version's leaf changes
 * and returns it with additional metadata
 */
export async function createChangeSetFromCurrentVersion(
	title?: string,
	description?: string,
) {
	try {
		const currentVersion = await selectCurrentVersion();

		// Get leaf changes from current version
		const changes = await lix.db
			.selectFrom("change")
			.where(changeIsLeafInVersion(currentVersion))
			.innerJoin("file", "change.file_id", "file.id")
			.where("file.path", "=", "/prosemirror.json")
			.select("change.id")
			.execute();

		// Create the change set with metadata
		const changeSet = await createChangeSet({
			lix,
			changes,
			// @ts-expect-error
			metadata: {
				title: title || "New change set",
				description,
			},
		});

		// Count the changes in the change set
		const changeCount = await countChangesInChangeSet(changeSet.id);

		// Get the account info
		const account = await selectActiveAccount();

		// Return the change set with additional metadata
		return {
			...changeSet,
			change_count: changeCount,
			account_name: account?.name,
			created_at: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Error creating change set:", error);
		throw error;
	}
}

/**
 * Creates a new change proposal between the current version and main version
 * Returns the created proposal with metadata
 */
export async function createProposalBetweenVersions(description?: string): Promise<
	ChangeProposal & {
		change_set_id: string;
		account_name?: string;
		created_at: string;
		change_count: number;
		from_version?: string;
		to_version?: string;
	}
> {
	try {
		const currentVersion = await selectCurrentVersion();
		const mainVersion = await selectMainVersion();
		const activeAccount = await selectActiveAccount();

		// Get leaf changes from both versions
		const sourceChanges = await lix.db
			.selectFrom("change")
			.where(changeIsLeafInVersion(currentVersion))
			.select("id")
			.execute();

		const targetChanges = await lix.db
			.selectFrom("change")
			.where(changeIsLeafInVersion(mainVersion))
			.select("id")
			.execute();

		// Create change sets with metadata
		const sourceChangeSet = await createChangeSet({
			lix,
			changes: sourceChanges,
			// @ts-expect-error
			metadata: {
				title: "Proposed changes",
				description: description?.trim() || undefined,
			},
		});

		const targetChangeSet = await createChangeSet({
			lix,
			changes: targetChanges,
		});

		// Create the change proposal
		const proposal = await createChangeProposal({
			lix,
			source_change_set: sourceChangeSet,
			target_change_set: targetChangeSet,
		});

		// Count the changes in the source change set
		const changeCount = await countChangesInChangeSet(sourceChangeSet.id);

		// Return the proposal with additional metadata
		return {
			...proposal,
			change_set_id: sourceChangeSet.id,
			account_name: activeAccount?.name,
			created_at: new Date().toISOString(),
			change_count: changeCount,
			from_version: currentVersion?.name,
			to_version: mainVersion?.name,
		};
	} catch (error) {
		console.error("Error creating proposal:", error);
		throw error;
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
export async function selectCurrentVersion() {
	return lix.db
		.selectFrom("current_version")
		.innerJoin("version", "current_version.id", "version.id")
		.selectAll()
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
	const result = await lix.db
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

	if (result) {
		// the automatic json parser doesn't work for some reason
		result.comments = JSON.parse(result.comments as unknown as string);
	}

	return result;
}

/**
 * Special change set which describes the current changes
 * that are not yet checkpointed.
 */
export async function selectCurrentChangeSet(): Promise<
	(ChangeSet & { change_count: number; created_at: string }) | null
> {
	try {
		const currentVersion = await selectCurrentVersion();

		const labelName = `current:${currentVersion.id}`;

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

		let looseChanges = await lix.db
			.selectFrom("change")
			.where(changeIsLeafInVersion(currentVersion))
			.innerJoin("file", "change.file_id", "file.id")
			.where("file.path", "=", "/prosemirror.json")
			.where((eb) => eb.not(changeHasLabel("checkpoint")))
			.where((eb) => eb.not(changeHasLabel(labelName)))
			.selectAll("change")
			.execute();

		if (!currentChangeSet) {
			currentChangeSet = await createChangeSet({
				lix,
				changes: looseChanges,
				labels: [label],
			});
		}

		if (looseChanges.length > 0) {
			await lix.db
				.insertInto("change_set_element")
				.values(
					looseChanges.map((c) => ({
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
