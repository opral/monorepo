import {
	Version,
	Change,
	changeHasLabel,
	changeInVersion,
	changeIsLeafInVersion,
	Lix,
	Snapshot,
	createThread,
	createCheckpoint,
	Thread,
} from "@lix-js/sdk";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { currentVersionAtom, lixAtom } from "../state.ts";
import clsx from "clsx";
import {
	activeFileAtom,
	getThreads,
	workingChangeSetAtom,
} from "../state-active-file.ts";
import { SlButton, SlInput } from "@shoelace-style/shoelace/dist/react";
import { saveLixToOpfs } from "../helper/saveLixToOpfs.ts";
import RowDiff from "./RowDiff.tsx";
import { CellSchemaV1 } from "@lix-js/plugin-csv";
import { fromPlainText, toPlainText, ZettelDoc } from "@lix-js/sdk/zettel-ast";

export default function Component(props: {
	id: string;
	authorName: string | null;
}) {
	const [isOpen, setIsOpen] = useState(
		props.id === "intermediate-changes" ? true : false
	);

	const [lix] = useAtom(lixAtom);
	const [activeFile] = useAtom(activeFileAtom);
	const [changes, setChanges] = useState<
		Awaited<ReturnType<typeof getChanges>>
	>({});
	const [threads, setThreads] = useState<Thread[]>([]);

	const [intermediateChanges, setIntermediateChanges] = useState<
		Awaited<ReturnType<typeof getIntermediateChanges>>
	>({});

	const [currentVersion] = useAtom(currentVersionAtom);

	useEffect(() => {
		if (isOpen) {
			if (props.id !== "intermediate-changes") {
				getChanges(lix, props.id, activeFile!.id, currentVersion).then(
					setChanges
				);
			} else {
				getIntermediateChanges(lix, activeFile!.id).then(
					setIntermediateChanges
				);
			}
			const interval = setInterval(async () => {
				if (props.id !== "intermediate-changes") {
					getChanges(lix, props.id, activeFile!.id, currentVersion).then(
						setChanges
					);
				} else {
					getIntermediateChanges(lix, activeFile!.id).then(
						setIntermediateChanges
					);
				}
			}, 1000);
			return () => clearInterval(interval);
		}
	}, [lix, activeFile, props.id]);

	useEffect(() => {
		const fetchThreads = async () => {
			if (props.id) {
				const threads = await getThreads(lix, props.id);
				if (threads) setThreads(threads);
			}
		};

		fetchThreads();
	}, []);

	// Get the first comment if it exists
	// @ts-expect-error - Typescript doesn't know that threads are created with initial comment
	const firstComment = threads?.[0]?.comments?.[0];

	// Truncate comment content if it's longer than 50 characters
	const truncatedComment =
		firstComment?.content
			? firstComment.content.length > 50
				? `${toPlainText(firstComment.content).substring(0, 50)}...`
				: toPlainText(firstComment.content)
			: null;

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
							{props.id === "intermediate-changes"
								? "Intermediate changes"
								: props.authorName}
						</p>
						<p className="text-sm! text-zinc-600">{truncatedComment}</p>
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
					{Object.keys(intermediateChanges).length > 0 && <CreateCheckpointBox />}

					{Object.keys(
						props.id === "intermediate-changes" ? intermediateChanges : changes
					).map((rowId) => {
						const uniqueColumnValue = rowId.split("|")[1];
						return (
							<RowDiff
								key={`${props.id}-${rowId}`}
								uniqueColumnValue={uniqueColumnValue}
								changes={
									props.id === "intermediate-changes"
										? intermediateChanges[rowId]
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

const CreateCheckpointBox = () => {
	const [description, setDescription] = useState("");
	const [lix] = useAtom(lixAtom);
	const [workingChangeSet] = useAtom(workingChangeSetAtom);

	const onThreadComposerSubmit = async (args: { content: ZettelDoc }) => {
		if (!description) return;

		lix.db.transaction().execute(async (trx) => {
			const thread = await createThread({
				lix: { ...lix, db: trx },
				comments: [{ content: args.content }],
			});
			await trx
				.insertInto("change_set_thread")
				.values({
					change_set_id: workingChangeSet!.id,
					thread_id: thread.id,
				})
				.execute();
		});
	};

	const handleCreateCheckpoint = async () => {
		await onThreadComposerSubmit({ content: fromPlainText(description!) });
		await createCheckpoint({ lix });
		await saveLixToOpfs({ lix });
	};

	// Handle key down in the comment textarea
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleCreateCheckpoint();
		}
	};


	return (
		<div className="flex gap-2">
			<SlInput
				className="w-full"
				placeholder="Describe the changes"
				onInput={(event: any) => setDescription(event.target?.value)}
				onKeyDown={handleKeyDown}
				value={description}
			></SlInput>
			<SlButton slot="footer" variant="primary" onClick={handleCreateCheckpoint}>
				{description === "" ? "Create checkpoint without description" : "Create checkpoint"}
			</SlButton>
		</div>
	);
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
				content: Snapshot["content"];
				parent: Change & { content: Snapshot["content"] };
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
		.where("change.schema_key", "=", CellSchemaV1.key)
		.where(changeHasLabel({ name: "checkpoint" }))
		.where("change_set_element.change_set_id", "=", changeSetId)
		.where("change.file_id", "=", fileId)
		.selectAll("change")
		.select("snapshot.content")
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
				// .where(changeInVersion(currentVersion))
				.where(changeHasLabel({ name: "checkpoint" }))
				.selectAll("change")
				.select("snapshot.content")
				.executeTakeFirst();

			// Process parent content if it exists
			if (parent && typeof parent.content === 'string') {
				try {
					parent.content = JSON.parse(parent.content);
				} catch (e) {
					// Keep as is if not valid JSON
				}
			}

			change.parent = parent || { content: null };
		}
	}
	return groupedByRow;
};

// duplicating because easier for now. clean up later
const getIntermediateChanges = async (
	lix: Lix,
	fileId: string
): Promise<
	Record<
		string,
		Array<
			Change & {
				content: Snapshot["content"];
				parent: Change & { content: Snapshot["content"] };
			}
		>
	>
> => {
	// Get the working change set ID 
	const workingChangeSetId = await lix.db
		.selectFrom("active_version")
		.innerJoin("version_v2", "active_version.version_id", "version_v2.id")
		.selectAll("version_v2")
		.executeTakeFirst()
		.then(version => version?.working_change_set_id);

	const intermediateLeafChanges = await lix.db
		.selectFrom("change")
		.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
		.innerJoin("change_set_element", "change_set_element.change_id", "change.id")
		.where(eb =>
			workingChangeSetId
				? eb("change_set_element.change_set_id", "=", workingChangeSetId)
				: eb.exists(
					eb.selectFrom("change_set_element")
						.whereRef("change_set_element.change_id", "=", "change.id")
						.where(eb => eb.not(changeHasLabel({ name: "checkpoint" })))
				)
		)
		.where("change.file_id", "=", fileId)
		.where("change.schema_key", "=", CellSchemaV1.key)
		.selectAll("change")
		.select("snapshot.content")
		.execute();

	// Parse the content fields if they are JSON strings
	const processedChanges = intermediateLeafChanges.map(change => {
		// Ensure content field is properly parsed from JSON if needed
		if (typeof change.content === 'string') {
			try {
				change.content = JSON.parse(change.content);
			} catch (e) {
				// Keep as is if not valid JSON
			}
		}
		return change;
	});

	const groupedByRow: Record<string, Array<any>> = {};

	for (const change of processedChanges) {
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
			// defining a parent as the last checkpoint change
			const parent = await lix.db
				.selectFrom("change")
				.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
				.where("change.entity_id", "=", change.entity_id)
				.where(changeHasLabel({ name: "checkpoint" }))
				// .where(changeInVersion(currentVersion))
				// TODO fix the filter
				// https://github.com/opral/lix-sdk/issues/151
				// .where(changeIsLowestCommonAncestorOf([change]))
				.where("change.schema_key", "=", CellSchemaV1.key)
				.selectAll("change")
				.select("snapshot.content")
				.executeTakeFirst();

			// Process parent content if it exists
			if (parent && typeof parent.content === 'string') {
				try {
					parent.content = JSON.parse(parent.content);
				} catch (e) {
					// Keep as is if not valid JSON
				}
			}

			change.parent = parent || { content: null };
		}
	}
	return groupedByRow;
};