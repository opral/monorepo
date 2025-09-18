import { Change, Lix, createConversation, createCheckpoint, LixVersion, type LixConversationMessage } from "@lix-js/sdk";
import { useAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { currentVersionAtom, lixAtom } from "../state.ts";
import clsx from "clsx";
import { activeFileAtom, checkpointChangeSetsAtom, getConversations, workingChangeSetAtom } from "../state-active-file.ts";
import { SlButton, SlInput } from "@shoelace-style/shoelace/dist/react";
import { saveLixToOpfs } from "../helper/saveLixToOpfs.ts";
import RowDiff from "./RowDiff.tsx";
import { CellSchemaV1 } from "@lix-js/plugin-csv";
import { fromPlainText, toPlainText, ZettelDoc } from "@lix-js/sdk/zettel-ast";

export default function Component(props: {
	changeSetid: string;
	previousChangeSetId?: string | null;
	authorName: string | null;
}) {
	const [workingChangeSet] = useAtom(workingChangeSetAtom);
	const [checkpointChangeSets] = useAtom(checkpointChangeSetsAtom);
	const isWorkingChangeSet = useCallback(
		() => props.changeSetid === workingChangeSet?.id,
		[props.changeSetid, workingChangeSet]
	);
	const [isOpen, setIsOpen] = useState(isWorkingChangeSet() ? true : false);

	const [lix] = useAtom(lixAtom);
	const [activeFile] = useAtom(activeFileAtom);
	const [changes, setChanges] = useState<
		Awaited<ReturnType<typeof getChanges>>
	>({});
	type ConversationWithComments = { id: string; comments: LixConversationMessage[] };
	const [threads, setThreads] = useState<ConversationWithComments[]>([]);

	const [intermediateChanges, setIntermediateChanges] = useState<
		Awaited<ReturnType<typeof getIntermediateChanges>>
	>({});

	const [currentVersion] = useAtom(currentVersionAtom);

	useEffect(() => {
		if (isOpen) {
			if (!isWorkingChangeSet()) {
				getChanges(
					lix,
					props.changeSetid,
					activeFile!.id,
					currentVersion,
					props.previousChangeSetId
				).then(setChanges);
			} else {
				getIntermediateChanges(
					lix,
					activeFile!.id,
					checkpointChangeSets?.[0]?.id
				).then(setIntermediateChanges);
			}
			const interval = setInterval(async () => {
				if (!isWorkingChangeSet()) {
					getChanges(
						lix,
						props.changeSetid,
						activeFile!.id,
						currentVersion,
						props.previousChangeSetId
					).then(setChanges);
				} else {
					getIntermediateChanges(
						lix,
						activeFile!.id,
						checkpointChangeSets?.[0]?.id
					).then(setIntermediateChanges);
				}
			}, 1000);
			return () => clearInterval(interval);
		}
	}, [lix, activeFile, props.changeSetid]);

	useEffect(() => {
		const fetchThreads = async () => {
			if (!props.changeSetid) return;
			// Find the commit for this change set
			const commit = await lix.db
				.selectFrom("commit")
				.where("change_set_id", "=", props.changeSetid)
				.select(["id"]) 
				.executeTakeFirst();
			if (!commit) return;
			const convs = await getConversations(lix, commit.id);
			if (convs) setThreads(convs);
		};

		fetchThreads();
	}, []);

	// Get the first comment if it exists
	const firstComment = threads?.[0]?.comments?.[0];

	// Truncate comment content if it's longer than 50 characters
	const truncatedComment = firstComment?.body
		? firstComment.body.content.length > 50
			? `${toPlainText(firstComment.body).substring(0, 50)}...`
			: toPlainText(firstComment.body)
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
							{isWorkingChangeSet() ? "Working changes" : props.authorName}
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
					{Object.keys(intermediateChanges).length > 0 && (
						<CreateCheckpointBox />
					)}

					{Object.keys(
						isWorkingChangeSet() ? intermediateChanges : changes
					).map((rowId) => {
						const uniqueColumnValue = rowId.split("|")[1];
						return (
							<RowDiff
								key={`${props.changeSetid}-${rowId}`}
								uniqueColumnValue={uniqueColumnValue}
								changes={
									isWorkingChangeSet()
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
			// Get the commit associated with the working change set
			const commit = await trx
				.selectFrom("commit")
				.where("change_set_id", "=", workingChangeSet!.id)
				.selectAll()
				.executeTakeFirst();

			if (!commit) {
				throw new Error("No commit found for working change set");
			}

			// Create conversation with entity (commit) attachment using the new system
			await createConversation({
				lix: { ...lix, db: trx },
				comments: [{ body: args.content }],
				entity: {
					entity_id: commit.id,
					schema_key: "lix_commit",
					file_id: "lix",
				},
			});
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
			<SlButton
				slot="footer"
				variant="primary"
				onClick={handleCreateCheckpoint}
			>
				{description === ""
					? "Create checkpoint without description"
					: "Create checkpoint"}
			</SlButton>
		</div>
	);
};

const getChanges = async (
	lix: Lix,
	changeSetId: string,
	fileId: string,
	// @ts-expect-error - not used yet
	currentVersion: LixVersion,
	previousChangeSetId?: string | undefined | null
): Promise<
	Record<
		string,
		Array<
			Change & {
				parent: Change;
			}
		>
	>
> => {
	const changes = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where("change.schema_key", "=", CellSchemaV1["x-lix-key"])
		.where("change_set_element.change_set_id", "=", changeSetId)
		.where("change.file_id", "=", fileId)
		.selectAll("change")
		.execute();

	// Process content fields if they are JSON strings
	const processedChanges = changes.map((change) => {
		if (typeof change.snapshot_content === "string") {
			try {
				change.snapshot_content = JSON.parse(change.snapshot_content);
			} catch (e) {
				console.log("Error parsing JSON:", e);
				// Keep as is if not valid JSON
			}
		}
		return change;
	});

	// Group changes by row
	const groupedByRow: Record<
		string,
		Array<
			Change & {
				parent: Change;
			}
		>
	> = {};

	for (const change of processedChanges) {
		const parts = change.entity_id.split("|");
		const rowEntityId = parts[0] + "|" + parts[1];

		if (!groupedByRow[rowEntityId]) {
			groupedByRow[rowEntityId] = [];
		}
		// @ts-expect-error - We'll add parent property later
		groupedByRow[rowEntityId].push(change);
	}

	for (const id in groupedByRow) {
		const row = groupedByRow[id];

		for (const change of row) {
			let parent;

			// If we have a previousChangeSetId, look for the change in that change set
			if (previousChangeSetId) {
				parent = await lix.db
					.selectFrom("change")
					.innerJoin(
						"change_set_element",
						"change_set_element.change_id",
						"change.id"
					)
					.where("change_set_element.change_set_id", "=", previousChangeSetId)
					.where("change.entity_id", "=", change.entity_id)
					.where("change.schema_key", "=", change.schema_key)
					.where("change.file_id", "=", fileId)
					.selectAll("change")
					.orderBy("change.created_at", "desc")
					.executeTakeFirst();
			}

			// Process parent content if it exists
			if (parent && typeof parent.snapshot_content === "string") {
				try {
					parent.snapshot_content = JSON.parse(parent.snapshot_content);
				} catch (e) {
					console.log("Error parsing parent JSON:", e);
					// Keep as is if not valid JSON
				}
			}

			// Provide a full parent object with all necessary properties
			change.parent = parent || {
				id: "",
				entity_id: change.entity_id,
				file_id: change.file_id,
				plugin_key: change.plugin_key,
				schema_key: change.schema_key,
				schema_version: change.schema_version,
				created_at: "",
				metadata: null,
				snapshot_content: null,
			};
		}
	}
	return groupedByRow;
};

// duplicating because easier for now. clean up later
const getIntermediateChanges = async (
	lix: Lix,
	fileId: string,
	latestCheckpointChangeSetId?: string | null
): Promise<
	Record<
		string,
		Array<
			Change & {
				parent: Change;
			}
		>
	>
> => {
	// Get the working change set ID
	const workingChangeSetId = await lix.db
		.selectFrom("active_version")
		.innerJoin("version", "active_version.version_id", "version.id")
		.selectAll("version")
		.executeTakeFirst()
		.then((version) => {
			// Get the working commit and its change set
			return (
				lix.db
					.selectFrom("commit")
					// eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
					.where("id", "=", version?.working_commit_id!)
					.select("change_set_id")
					.executeTakeFirst()
					.then((commit) => commit?.change_set_id)
			);
		});

	const intermediateLeafChanges = await lix.db
		.selectFrom("change")
		.innerJoin(
			"change_set_element",
			"change_set_element.change_id",
			"change.id"
		)
		.where("change_set_element.change_set_id", "=", workingChangeSetId!)
		.where("change.file_id", "=", fileId)
		.where("change.schema_key", "=", CellSchemaV1["x-lix-key"])
		.selectAll("change")
		.execute();

	// Parse the content fields if they are JSON strings
	const processedChanges = intermediateLeafChanges.map((change) => {
		// Ensure content field is properly parsed from JSON if needed
		if (typeof change.snapshot_content === "string") {
			try {
				change.snapshot_content = JSON.parse(change.snapshot_content);
			} catch (e) {
				console.log("Error parsing JSON:", e);
				// Keep as is if not valid JSON
			}
		}
		return change;
	});

	const groupedByRow: Record<
		string,
		Array<
			Change & {
				parent: Change;
			}
		>
	> = {};

	for (const change of processedChanges) {
		const parts = change.entity_id.split("|");
		const rowEntityId = parts[0] + "|" + parts[1];

		if (!groupedByRow[rowEntityId]) {
			groupedByRow[rowEntityId] = [];
		}
		// @ts-expect-error - We'll add parent property later
		groupedByRow[rowEntityId].push(change);
	}

	for (const id in groupedByRow) {
		const row = groupedByRow[id];

		for (const change of row) {
			// defining a parent as the last checkpoint change
			if (latestCheckpointChangeSetId) {
				const parent = await lix.db
					.selectFrom("change")
					.innerJoin(
						"change_set_element",
						"change_set_element.change_id",
						"change.id"
					)
					.where(
						"change_set_element.change_set_id",
						"=",
						latestCheckpointChangeSetId
					)
					.where("change.entity_id", "=", change.entity_id)
					.where("change.schema_key", "=", CellSchemaV1["x-lix-key"])
					.selectAll("change")
					.executeTakeFirst();

				// Process parent content if it exists
				if (parent && typeof parent.snapshot_content === "string") {
					try {
						parent.snapshot_content = JSON.parse(parent.snapshot_content);
					} catch (e) {
						console.log("Error parsing JSON:", e);
						// Keep as is if not valid JSON
					}
				}

				// Provide a full parent object with all necessary properties
				change.parent = parent || {
					id: "",
					entity_id: change.entity_id,
					file_id: change.file_id,
					plugin_key: change.plugin_key,
					schema_key: change.schema_key,
					schema_version: change.schema_version,
					created_at: "",
					metadata: null,
					snapshot_content: null,
				};
			}
		}
	}
	return groupedByRow;
};
