import { commit } from "./commit.js";
import { v4 } from "uuid";

function indexByFileId(changes: any) {
	const changesByFileId: Record<string, any> = {};
	changes.forEach((change: any) => {
		if (!changesByFileId[change.file_id]) {
			changesByFileId[change.file_id] = {};
		}
		if (!changesByFileId[change.file_id][change.value.id]) {
			changesByFileId[change.file_id][change.value.id] = [];
		}

		changesByFileId[change.file_id][change.value.id].push(change);
	});

	return changesByFileId;
}

export async function merge({
	db,
	incommingDb,
	plugins,
	userId,
}: {
	db: any;
	incommingDb: any;
	plugins: any;
	userId: string;
}) {
	const dirty = await db
		.selectFrom("change")
		.select("id")
		.where("commit_id", "is", null)
		.executeTakeFirst();

	if (dirty) {
		throw new Error("cannot merge on uncommited changes, pls commit first");
	}

	const hasConflicts = await db
		.selectFrom("change")
		.selectAll()
		.where("conflict", "is not", null)
		.executeTakeFirst();
	if (hasConflicts) {
		throw new Error("cannot merge on existing conflicts, pls resolve first");
	}

	const { commit_id: aHead } = await db
		.selectFrom("ref")
		.selectAll()
		.where("name", "=", "current")
		.executeTakeFirstOrThrow();

	const { commit_id: bHead } = await incommingDb
		.selectFrom("ref")
		.selectAll()
		.where("name", "=", "current")
		.executeTakeFirstOrThrow();

	if (aHead === bHead) {
		return;
	}
	// TODO: use single join on attached database instead

	const bOnlyCommits = [];
	const bOnlyChanges = [];
	let commonAncestor;
	let currentBCommitId = bHead;
	while (currentBCommitId) {
		const commit = await incommingDb
			.selectFrom("commit")
			.selectAll()
			.where("id", "=", currentBCommitId)
			.executeTakeFirst();
		if (!commit) {
			break;
		}

		commonAncestor = await db
			.selectFrom("commit")
			.selectAll()
			.where("id", "=", commit.id)
			.executeTakeFirst();

		if (commonAncestor) {
			break;
		}

		bOnlyCommits.push(commit);
		bOnlyChanges.push(
			...(await incommingDb
				.selectFrom("change")
				.selectAll()
				.where("commit_id", "=", commit.id)
				.execute()),
		);
		currentBCommitId = commit.parent_id;
	}

	if (!commonAncestor) {
		throw new Error("no common ancestor found");
	}

	const aOnlyChanges = [];
	const aOnlyCommits = [];
	let currentACommitId = aHead;
	while (currentACommitId && currentACommitId !== commonAncestor.id) {
		const commit = await db
			.selectFrom("commit")
			.selectAll()
			.where("id", "=", currentACommitId)
			.executeTakeFirst();

		aOnlyCommits.push(commit);

		aOnlyChanges.push(
			...(await db
				.selectFrom("change")
				.selectAll()
				.where("commit_id", "=", commit.id)
				.execute()),
		);

		currentACommitId = commit.parent_id;
	}

	const aOnlyChangesByFileId = indexByFileId(aOnlyChanges);
	const bOnlyChangesByFileId = indexByFileId(bOnlyChanges);

	// FIXME: new files in a are ignored for now, could have info relevant for merging, so best to add this

	const fileChanges: any[] = [];
	for (const [fileId, atomChangesByAtomId] of Object.entries(
		bOnlyChangesByFileId,
	)) {
		if (!aOnlyChangesByFileId[fileId]) {
			console.warn("TODO: copy over new files fileId: " + fileId);
			continue;
		}

		const fileChange: {
			fileId: string;
			changes: any[];
			conflicts: any[];
		} = {
			fileId: fileId,
			changes: [],
			conflicts: [],
		};
		// @ts-ignore
		for (const [atomId, atomChanges] of Object.entries(atomChangesByAtomId)) {
			if (aOnlyChangesByFileId[fileId][atomId]) {
				const current = aOnlyChangesByFileId[fileId][atomId];
				const base = await db
					.selectFrom("change")
					.selectAll()
					.where("id", "=", current.at(-1).parent_id)
					.executeTakeFirstOrThrow();

				fileChange.conflicts.push({ current, incoming: atomChanges, base });
			} else {
				fileChange.changes.push(atomChanges);
			}
		}

		fileChanges.push(fileChange);
	}

	const mergeResults: any[] = [];
	for (const fileChange of fileChanges) {
		const { data: current } = await db
			.selectFrom("file_internal")
			.select("data")
			.where("id", "=", fileChange.fileId)
			.executeTakeFirst();

		const { data: incoming } = await incommingDb
			.selectFrom("file_internal")
			.select("data")
			.where("id", "=", fileChange.fileId)
			.executeTakeFirst();

		for (const plugin of plugins) {
			const mergeRes = await plugin.merge!.file!({
				current,
				incoming,
				...fileChange,
			});

			mergeResults.push({ fileId: fileChange.fileId, ...mergeRes });
		}
	}

	for (const { fileId, result, unresolved } of mergeResults) {
		if (result) {
			await db
				.updateTable("file")
				.set({
					data: result,
				})
				.where("id", "=", fileId)
				.execute();
		}

		if (unresolved) {
			for (const { current, incoming } of unresolved) {
				const parent = await db
					.selectFrom("change")
					.select("id")
					.where(
						(eb: any) => eb.ref("value", "->>").key("id"),
						"=",
						current[0].value.id,
					)
					.where("type", "=", current[0].type)
					.where("file_id", "=", current[0].file_id)
					.where("plugin_key", "=", current[0].plugin_key)
					.where("commit_id", "is not", null)
					.executeTakeFirst();

				await db
					.insertInto("change")
					.values({
						id: v4(),
						type: current[0].type,
						operation: "update",
						file_id: current[0].file_id,
						plugin_key: current[0].plugin_key,
						parent_id: parent?.id,
						value: JSON.stringify(current[0].value),
						conflict: JSON.stringify(incoming),
					})
					.execute();
			}
		}
	}

	// TODO: sync in the history from the incoming database and add a link in the merge commit
	await commit({
		db,
		userId,
		description: "Merge",
		merge: true,
	});
}
