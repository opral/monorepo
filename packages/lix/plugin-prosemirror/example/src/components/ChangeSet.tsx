import { forwardRef, useImperativeHandle, useEffect } from "react";
import { toRelativeTime } from "../utilities/timeUtils";
import {
	EraserIcon,
	Eye,
	EyeOff,
	// History,
	Clock,
	ChevronRight,
} from "lucide-react";
import {
    transition,
    createConversation,
    type LixChangeSet as ChangeSetType,
} from "@lix-js/sdk";
import { useKeyValue } from "../hooks/useKeyValue";
import { selectActiveAccount, selectConversations } from "../queries";
import { getInitials } from "../utilities/nameUtils";
import { Composer, Thread } from "./Thread";
import { toPlainText, ZettelDoc } from "@lix-js/sdk/dependency/zettel-ast";
import { useLix, useQuery, useQueryTakeFirst } from "@lix-js/react-utils";

export interface ChangeSetHandle {
	getCommentText: () => string;
	clearCommentText: () => void;
}

interface ChangeSetProps {
	changeSet: ChangeSetType & { change_count: number; created_at?: string };
	isWorkingChangeSet?: boolean;
	previousChangeSetId?: string;
	alwaysExpand?: boolean;
	showRestore?: boolean;
	showUndo?: boolean;
	footer?: React.ReactNode;
}

export const ChangeSet = forwardRef<ChangeSetHandle, ChangeSetProps>(
	(
		{
			changeSet,
			isWorkingChangeSet = false,
			previousChangeSetId,
			alwaysExpand = false,
			// showRestore = true,
			showUndo = true,
			footer,
		},
		ref,
	) => {
		const lix = useLix();
		// Use shared key-value storage for expansion state
		const [expandedChangeSetId, setExpandedChangeSetId] = useKeyValue<
			string | null
		>("expandedChangeSetId", { versionId: "global", untracked: true });

		const [diffView, setDiffView] = useKeyValue<{
			beforeCsId?: string;
			afterCsId?: string;
		} | null>("diffView", { versionId: "global", untracked: true });

		const activeAccount = useQueryTakeFirst(({ lix }) => selectActiveAccount(lix));

		// Determine if this change set is the expanded one
		const isExpanded = alwaysExpand || expandedChangeSetId === changeSet.id;

		// Auto-expand current change set only when component first mounts
		useEffect(() => {
			// Only auto-expand if this is the current change set and no change set is currently expanded
			if (isWorkingChangeSet && expandedChangeSetId === null) {
				setExpandedChangeSetId(changeSet.id);
			}
		}, [
			// Only run this effect once when the component mounts
			// eslint-disable-next-line react-hooks/exhaustive-deps
			isWorkingChangeSet,
			changeSet,
		]);

		// Get the commit ID for this change set
		const commits = useQuery(({ lix }) =>
			lix.db
				.selectFrom("commit")
				.where("change_set_id", "=", changeSet.id)
				.select("id"),
		);

		const commit = commits?.[0];

		const threads: any = useQuery(({ lix }) => {
			if (!commit?.id) {
				return [] as any;
			}
			return selectConversations(lix, { commitId: commit.id });
		});

		// Removed the console.log statement as it is a debugging artifact.

		// Get the first comment if it exists
		const firstComment = threads?.[0]?.comments?.[0];

		// Truncate comment content if it's longer than 50 characters
		const truncatedComment =
			firstComment?.body && !isWorkingChangeSet
				? firstComment.body.content.length > 50
					? `${toPlainText(firstComment.body).substring(0, 50)}...`
					: toPlainText(firstComment.body)
				: null;

		// Expose methods to parent components
		useImperativeHandle(ref, () => ({
			getCommentText: () => "",
			clearCommentText: () => {},
		}));

		const onThreadComposerSubmit = async (args: { body: ZettelDoc }) => {
			if (!commit?.id) {
				console.error("Cannot create conversation: commit not found for change set");
				return;
			}

            // Create conversation attached to the commit entity
            await createConversation({
                lix,
                versionId: "global",
                comments: [{ body: args.body }],
                entity: {
                    entity_id: commit.id,
					schema_key: "lix_commit",
					file_id: "lix",
				},
			});
		};

		// Toggle expansion state
		const handleToggleExpand = () => {
			// If alwaysExpand
			// If this change set is already expanded, collapse it
			// Otherwise, expand this change set (which automatically collapses any other)
			setExpandedChangeSetId(isExpanded ? null : changeSet.id);
		};

		return (
			<div className="bg-base-100">
				<div
					className={
						alwaysExpand
							? "flex items-center p-2"
							: "flex items-center p-2 cursor-pointer hover:bg-base-200"
					}
					onClick={handleToggleExpand}
				>
					<div
						className={`w-8 h-8 flex items-center justify-center mr-2 rounded-full ${isWorkingChangeSet ? "bg-blue-100" : "bg-base-300"}`}
					>
						{/* Icon: clock for current changes, user avatar for others */}
						{isWorkingChangeSet ? (
							<Clock size={16} />
						) : (
							<span>{getInitials(activeAccount?.name ?? "")}</span>
						)}
					</div>
					<div className="flex-1">
						<div className="text-sm break-words">
							{isWorkingChangeSet
								? "Current changes"
								: truncatedComment
									? truncatedComment
									: "No description yet"}
						</div>
						{!isWorkingChangeSet && (
							<div className="text-xs text-base-content-secondary">
								{changeSet?.created_at && toRelativeTime(changeSet.created_at)}
							</div>
						)}
					</div>
					<ChevronRight
						size={16}
						className={`transition-transform duration-300 ${isExpanded ? "transform rotate-90" : ""}`}
					/>
				</div>

				{isExpanded && (
					<div className="bg-base-100">
						{/* Action buttons bar with change count */}
						<div className="flex items-center justify-between p-2 bg-base-200 border-b border-base-300">
							<div className="text-sm items-center gap-2 hidden md:flex">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									className="lucide ml-2"
								>
									<path
										fill="currentColor"
										d="M12 22q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2q.425 0 .713.288T13 3v7.275q.45.275.725.713T14 12q0 .825-.587 1.413T12 14t-1.412-.587T10 12q0-.575.275-1.025t.725-.7v-2.15q-1.3.35-2.15 1.413T8 12q0 1.65 1.175 2.825T12 16t2.825-1.175T16 12q0-.65-.187-1.2T15.3 9.75q-.25-.35-.225-.775t.3-.7q.3-.3.713-.3t.662.35q.575.775.913 1.7T18 12q0 2.5-1.75 4.25T12 18t-4.25-1.75T6 12q0-2.25 1.425-3.912T11 6.075V4.05q-2.975.375-4.988 2.625T4 12q0 3.35 2.325 5.675T12 20t5.675-2.325T20 12q0-1.45-.475-2.738t-1.35-2.337q-.275-.325-.275-.75t.3-.725t.713-.287t.687.337q1.125 1.325 1.763 2.975T22 12q0 2.075-.788 3.9t-2.137 3.175t-3.175 2.138T12 22"
									/>
								</svg>

								<span className="inline">{changeSet?.change_count || 0}</span>
								<span className="hidden xl:inline">
									{changeSet?.change_count === 1
										? "relevant change"
										: "relevant changes"}
								</span>
							</div>
							<div className="flex items-center gap-1">
								{/* {showRestore && (
									<div className="tooltip" data-tip="Restore">
										<button
											className="btn btn-sm btn-ghost"
											onClick={async () => {}}
											title="Restore to this change set"
										>
											<History size={16} />
										</button>
									</div>
								)} */}

								{showUndo && (
									<div className="tooltip" data-tip="Undo">
										<button
											className="btn btn-sm btn-ghost"
											onClick={async () => {
												// Find the commit for this change set
												const commit = await lix.db
													.selectFrom("commit")
													.where("change_set_id", "=", changeSet.id)
													.selectAll()
													.executeTakeFirst();

												if (!commit) {
													console.error("Could not find commit for change set");
													return;
												}

												// Find the parent of this commit and transition to it
												const parent = await lix.db
													.selectFrom("commit_edge")
													.where("child_id", "=", commit.id)
													.select(["parent_id"])
													.executeTakeFirst();

												if (!parent) {
													console.error("Cannot undo: commit has no parent");
													return;
												}

												await transition({ lix, to: { id: parent.parent_id } });
											}}
											title="Undo this change set"
										>
											<EraserIcon size={16} />
										</button>
									</div>
								)}

								<button
									className="btn btn-sm btn-ghost gap-1 flex items-center"
									onClick={async () => {
										if (diffView) {
											await setDiffView(null);
										} else {
											await setDiffView({
												beforeCsId: previousChangeSetId,
												afterCsId: changeSet.id,
											});
										}
									}}
									title={diffView ? "Hide Diff" : "View Diff"}
								>
									{diffView ? <EyeOff size={16} /> : <Eye size={16} />}
									{diffView ? "Hide Diff" : "View Diff"}
								</button>
							</div>
						</div>

						{/* Render existing threads */}
						<div className="p-2">
							{threads.map((thread) => (
								<Thread
									key={thread.id}
									lix={lix}
									thread={thread}
									comments={thread.comments}
									onComposerSubmit={onThreadComposerSubmit}
								/>
							))}
							{/* Conditionally render the Composer for *new* threads */}
							{(!threads || threads.length === 0) && (
								<Composer lix={lix} onComposerSubmit={onThreadComposerSubmit} />
							)}
						</div>

						{/* Render footer if provided */}
						{footer && <div className="p-2">{footer}</div>}
					</div>
				)}
			</div>
		);
	},
);
