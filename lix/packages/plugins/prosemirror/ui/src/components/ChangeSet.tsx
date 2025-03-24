import { useRef, forwardRef, useImperativeHandle, useEffect } from "react";
import { Discussion, DiscussionHandle } from "./Discussion";
import { toRelativeTime } from "../utilities/timeUtils";
import { EraserIcon, Eye, History, Clock, ChevronRight } from "lucide-react";
import type { ChangeSet as ChangeSetType } from "@lix-js/sdk";
import { useQuery } from "../hooks/useQuery";
import { selectDiscussion } from "../queries";
import { useKeyValue } from "../hooks/useKeyValue";
import { restoreChangeSet } from "../utilities/restoreChangeSet";
import { undoChangeSet } from "../utilities/undoChangeSet";

export interface ChangeSetHandle {
	getCommentText: () => string;
	clearCommentText: () => void;
}

interface ChangeSetProps {
	changeSet: ChangeSetType & { change_count: number; created_at: string };
	isCurrentChangeSet?: boolean;
	footer?: React.ReactNode;
}

export const ChangeSet = forwardRef<ChangeSetHandle, ChangeSetProps>(
	({ changeSet, isCurrentChangeSet = false, footer }, ref) => {
		// Use shared key-value storage for expansion state
		const [expandedChangeSetId, setExpandedChangeSetId] = useKeyValue<
			string | null
		>("checkpoints.expandedChangeSetId");

		// Determine if this change set is the expanded one
		const isExpanded = expandedChangeSetId === changeSet.id;

		// Auto-expand current change set only when component first mounts
		useEffect(() => {
			// Only auto-expand if this is the current change set and no change set is currently expanded
			if (isCurrentChangeSet && expandedChangeSetId === null) {
				setExpandedChangeSetId(changeSet.id);
			}
		}, [
			// Only run this effect once when the component mounts
			// eslint-disable-next-line react-hooks/exhaustive-deps
			isCurrentChangeSet,
			changeSet,
		]);

		const [discussion] = useQuery(() =>
			selectDiscussion({ changeSetId: changeSet.id }),
		);
		const discussionRef = useRef<DiscussionHandle>(null);

		// Get the first comment if it exists
		const firstComment = discussion?.comments?.[0];

		// Truncate comment content if it's longer than 50 characters
		const truncatedComment =
			firstComment?.content && !isCurrentChangeSet
				? firstComment.content.length > 50
					? `${firstComment.content.substring(0, 50)}...`
					: firstComment.content
				: null;

		// Expose methods to parent components
		useImperativeHandle(ref, () => ({
			getCommentText: () => discussionRef.current?.getCommentText() || "",
			clearCommentText: () => discussionRef.current?.clearCommentText(),
		}));

		// Toggle expansion state
		const handleToggleExpand = () => {
			// If this change set is already expanded, collapse it
			// Otherwise, expand this change set (which automatically collapses any other)
			setExpandedChangeSetId(isExpanded ? null : changeSet.id);
		};

		return (
			<div className="bg-base-100">
				<div
					className={`flex items-center p-2 cursor-pointer hover:bg-base-200`}
					onClick={handleToggleExpand}
				>
					<div
						className={`w-8 h-8 flex items-center justify-center mr-2 rounded-full ${isCurrentChangeSet ? "bg-blue-100" : "bg-base-300"}`}
					>
						{/* Icon: clock for current changes, user avatar for others */}
						{isCurrentChangeSet ? <Clock size={16} /> : <span>U</span>}
					</div>
					<div className="flex-1">
						<div className="text-sm truncate">
							{isCurrentChangeSet
								? "Current Change Set"
								: truncatedComment
									? truncatedComment
									: "Untitled change set"}
						</div>
						{!isCurrentChangeSet && (
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
							<div className="text-sm flex items-center gap-2">
								<span className="hidden lg:inline">
									{changeSet?.change_count || 0}{" "}
									{changeSet?.change_count === 1
										? "relevant change"
										: "relevant changes"}
								</span>
							</div>
							<div className="flex items-center gap-1">
								<div className="tooltip" data-tip="Undo">
									<button
										className="btn btn-sm btn-ghost"
										onClick={() => undoChangeSet(changeSet.id)}
										title="Undo this change set"
									>
										<EraserIcon size={16} />
									</button>
								</div>

								{!isCurrentChangeSet && (
									<div className="tooltip" data-tip="Restore">
										<button
											className="btn btn-sm btn-ghost"
											onClick={() => restoreChangeSet(changeSet.id)}
											title="Restore to this change set"
										>
											<History size={16} />
										</button>
									</div>
								)}

								<button
									className="btn btn-sm btn-ghost gap-1"
									onClick={() => {
										// Implement view diff functionality
										console.log("View diff");
									}}
									title="View diff"
								>
									<Eye size={16} />
									View diff
								</button>
							</div>
						</div>

						{/* Always render the Discussion component when expanded */}
						<div className="p-2">
							<Discussion
								ref={discussionRef}
								changeSetId={changeSet.id}
								placeholderText="Write a comment..."
							/>
						</div>

						{/* Render footer if provided */}
						{footer && <div className="p-2">{footer}</div>}
					</div>
				)}
			</div>
		);
	},
);
