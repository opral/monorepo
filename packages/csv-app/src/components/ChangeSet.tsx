import {
	Version,
	Change,
	changeHasLabel,
	changeInVersion,
	changeIsLeafInVersion,
	ChangeSet,
	Lix,
	Snapshot,
} from "@lix-js/sdk";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { currentVersionAtom, lixAtom } from "../state.ts";
import clsx from "clsx";
import {
	activeFileAtom,
	unconfirmedChangesAtom,
} from "../state-active-file.ts";
import { SlButton, SlInput } from "@shoelace-style/shoelace/dist/react";
import { saveLixToOpfs } from "../helper/saveLixToOpfs.ts";
import { confirmChanges } from "../helper/confirmChanges.ts";
import RowDiff from "./RowDiff.tsx";

export default function Component(props: {
	id: string;
	firstComment: string | null;
}) {
	const [isOpen, setIsOpen] = useState(
		props.id === "unconfirmed-changes" ? true : false
	);

	const [lix] = useAtom(lixAtom);
	const [activeFile] = useAtom(activeFileAtom);
	const [changes, setChanges] = useState<
		Awaited<ReturnType<typeof getChanges>>
	>({});

	const [unconfirmedChanges, setUnconfirmedChanges] = useState<
		Awaited<ReturnType<typeof getChanges>>
	>({});

	const [currentVersion] = useAtom(currentVersionAtom);

	useEffect(() => {
		if (isOpen) {
			if (props.id !== "unconfirmed-changes") {
				getChanges(lix, props.id, activeFile.id, currentVersion).then(
					setChanges
				);
			} else {
				getUnconfirmedChanges(lix, activeFile.id, currentVersion).then(
					setUnconfirmedChanges
				);
			}
			const interval = setInterval(async () => {
				if (props.id !== "unconfirmed-changes") {
					getChanges(lix, props.id, activeFile.id, currentVersion).then(
						setChanges
					);
				} else {
					getUnconfirmedChanges(lix, activeFile.id, currentVersion).then(
						setUnconfirmedChanges
					);
				}
			}, 1000);
			return () => clearInterval(interval);
		}
	}, [lix, activeFile, props.id]);

	return (
		<div
			className={clsx(
				"flex flex-col cursor-pointer group bg-white hover:bg-zinc-50",
				isOpen && "bg-white!"
			)}
		>
			<div
				className="flex gap-3 items-center"
				onClick={() => setIsOpen(!isOpen)}
			>
				<div className="w-5 h-5 bg-zinc-100 flex items-center justify-center rounded-full ml-4">
					<div className="w-2 h-2 bg-zinc-700 rounded-full"></div>
				</div>
				<div className="flex-1 flex gap-2 items-center justify-between py-3 rounded md:h-[46px]">
					<div className="flex flex-col md:flex-row md:gap-2 md:items-center flex-1">
						<p className="text-zinc-950 text-sm! font-semibold">
							{props.id === "unconfirmed-changes"
								? "Unconfirmed changes"
								: "TODO (author name)"}
						</p>
						<p className="text-sm! text-zinc-600">{props.firstComment}</p>
					</div>
					<p className="text-sm! pr-5 flex items-center gap-4 flex-1]">
						{/* {timeAgo(change.created_at)} */}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="1em"
							height="1em"
							viewBox="0 0 24 24"
							className="text-zinc-600"
						>
							<path
								fill="none"
								stroke="currentColor"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="m4 9l8 8l8-8"
							/>
						</svg>
					</p>
				</div>
			</div>
			<div className={clsx(isOpen ? "block" : "hidden")}>
				<div className="flex flex-col gap-2 px-3 pb-3">
					{Object.keys(unconfirmedChanges).length > 0 && <ConfirmChangesBox />}

					{Object.keys(
						props.id === "unconfirmed-changes" ? unconfirmedChanges : changes
					).map((rowId) => {
						const uniqueColumnValue = rowId.split("|")[1];
						return (
							<RowDiff
								uniqueColumnValue={uniqueColumnValue}
								changes={
									props.id === "unconfirmed-changes"
										? unconfirmedChanges[rowId]
										: changes[rowId]
								}
							></RowDiff>
						);
					})}
				</div>
			</div>
		</div>
	);
}

const ConfirmChangesBox = () => {
	const [description, setDescription] = useState("");
	const [lix] = useAtom(lixAtom);
	const [unconfirmedChanges] = useAtom(unconfirmedChangesAtom);

	const handleConfirmChanges = async () => {
		const changeSet = await confirmChanges(lix, unconfirmedChanges);
		if (description !== "") {
			await addDiscussionToChangeSet(lix, changeSet, description);
			await saveLixToOpfs({ lix });
		}
	};

	return (
		<div className="flex gap-2">
			<SlInput
				className="w-full"
				placeholder="Describe the changes"
				onInput={(event: any) => setDescription(event.target?.value)}
			></SlInput>
			<SlButton slot="footer" variant="primary" onClick={handleConfirmChanges}>
				{description === "" ? "Confirm without description" : "Confirm"}
			</SlButton>
		</div>
	);
};

const addDiscussionToChangeSet = async (
	lix: Lix,
	changeSet: ChangeSet,
	content: string
) => {
	await lix.db.transaction().execute(async (trx) => {
		const discussion = await trx
			.insertInto("discussion")
			.values({
				change_set_id: changeSet.id,
			})
			.returning("id")
			.executeTakeFirstOrThrow();

		await trx
			.insertInto("comment")
			.values({
				discussion_id: discussion.id,
				content,
			})
			.execute();
	});
};

const getChanges = async (
	lix: Lix,
	changeSetId: string,
	fileId: string,
	currentVersion: Version
): Promise<
	Record<
		string,
		Array<
			Change & {
				snapshot_content: Snapshot["content"];
				parent: Change & { snapshot_content: Snapshot["content"] };
			}
		>
	>
> => {
	const changes = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where("change_set_element.change_set_id", "=", changeSetId)
		.where("change.file_id", "=", fileId)
		.selectAll("change")
		.select("snapshot.content as snapshot_content")
		.execute();

	// Group changes by row
	//
	// TODO this is a workaround for the fact that the changes are not groupable by row with SQL
	//
	//      this can be achieved by adding a row_entity to the snapshot but ...
	//      then the snapshot === undefined can't be used to detect a deletion.
	//
	//      1. Snapshot === undefined is not good for deletions. It is probably
	//         better to have a dedicated concept of deleted changes
	//
	//      2. The row_entity could be change metadata but what's the differenc to snapshot then?
	//
	//      3. Lix should probably have a concept of dependent changes that are linked.
	//         e.g. a row change is dependent on N cell changes via detectedChange.dependsOn: [detectedCellChange1, detectedCellChange2]
	//
	//      EDIT regarding 3:
	//      We can define an row and have as snapshot { dependsOn: [detectedCellChange1, detectedCellChange2] }
	//      before introducing a first level concept in lix. Yes, foreign keys wouldn't work but that's OK at the moment.
	const groupedByRow: any = {};

	for (const change of changes) {
		const parts = change.entity_id.split("|");
		const rowEntityId = parts[0] + "|" + parts[1];

		if (!groupedByRow[rowEntityId]) {
			groupedByRow[rowEntityId] = [];
		}
		groupedByRow[rowEntityId].push(change);
	}

	for (const id in groupedByRow) {
		const row = groupedByRow[id];

		for (const change of row) {
			const parent = await lix.db
				.selectFrom("change")
				.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
				.innerJoin("change_edge", "change_edge.parent_id", "change.id")
				.where("change_edge.child_id", "=", change.id)
				.where(changeInVersion(currentVersion))
				.where(changeHasLabel("confirmed"))
				.selectAll("change")
				.select("snapshot.content as snapshot_content")
				.executeTakeFirst();

			change.parent = parent;
		}
	}
	return groupedByRow;
};

// duplicating because easier for now. clean up later
const getUnconfirmedChanges = async (
	lix: Lix,
	fileId: string,
	currentVersion: Version
): Promise<
	Record<
		string,
		Array<
			Change & {
				snapshot_content: Snapshot["content"];
				parent: Change & { snapshot_content: Snapshot["content"] };
			}
		>
	>
> => {
	const unconfirmedLeafChanges = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.where("change.file_id", "=", fileId)
		.where(changeIsLeafInVersion(currentVersion))
		.where((eb) => eb.not(changeHasLabel("confirmed")))
		.selectAll("change")
		.select("snapshot.content as snapshot_content")
		.execute();

	const groupedByRow: any = {};

	for (const change of unconfirmedLeafChanges) {
		const parts = change.entity_id.split("|");
		const rowEntityId = parts[0] + "|" + parts[1];

		if (!groupedByRow[rowEntityId]) {
			groupedByRow[rowEntityId] = [];
		}
		groupedByRow[rowEntityId].push(change);
	}

	for (const id in groupedByRow) {
		const row = groupedByRow[id];

		for (const change of row) {
			// defining a parent as the last confirmed change
			const parent = await lix.db
				.selectFrom("change")
				.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
				.where(changeHasLabel("confirmed"))
				.where("change.entity_id", "=", change.entity_id)
				.where(changeInVersion(currentVersion))
				// todo don't rely on timestampt to traverse the graph
				// use recursive graph traversal instead
				.orderBy("change.created_at", "desc")
				.selectAll("change")
				.select("snapshot.content as snapshot_content")
				.executeTakeFirst();

			change.parent = parent;
		}
	}
	console.log("unconfirmed changes", groupedByRow);
	return groupedByRow;
};