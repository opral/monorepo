import type React from "react";

import { useRef, useEffect } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { useChangeSets } from "./change-set-context";
import type { Comment as CommentType } from "./change-set-context";
import { Avatar } from "./ui/avatar";

// CommentItem component moved into the Discussion file
interface CommentProps {
	comment: CommentType;
}

function Comment({ comment }: CommentProps) {
	return (
		<div className="pb-3">
			<div className="flex items-start gap-2 mb-1">
				<Avatar
					initials={comment.author.initials}
					size="sm"
					className="mt-0.5"
				/>
				<div className="flex-1">
					<div className="flex items-baseline">
						<span className="text-xs font-medium">{comment.author.name}</span>
						<span className="text-xs text-muted-foreground ml-2">
							{comment.timestamp}
						</span>
					</div>
					<div className="text-xs mt-1">{comment.text}</div>
				</div>
			</div>
		</div>
	);
}

interface DiscussionProps {
	changeSetId: string;
	autoFocus?: boolean;
	customActions?: React.ReactNode;
	placeholderText?: string;
	preventCheckpointOnEnter?: boolean;
	hideSubmitButton?: boolean;
}

export function Discussion({
	changeSetId,
	autoFocus = false,
	customActions,
	placeholderText = "Add a comment...",
	preventCheckpointOnEnter = false,
	hideSubmitButton = false,
}: DiscussionProps) {
	const {
		changeSets,
		newComments,
		handleCommentChange,
		addComment,
		proposalChangeSet,
		latestChangesComments,
		addLatestChangesComment,
		isCreatingNewVersion,
	} = useChangeSets();

	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Find the change set - either from the regular change sets or the proposal change set
	const changeSet =
		proposalChangeSet?.id === changeSetId
			? proposalChangeSet
			: changeSets.find((cs) => cs.id === changeSetId);

	// Focus the textarea when the component mounts if autoFocus is true
	useEffect(() => {
		// Only auto-focus if explicitly requested AND we're not creating a new version
		if (autoFocus && textareaRef.current && !isCreatingNewVersion) {
			// Small delay to ensure the DOM is fully rendered
			setTimeout(() => {
				textareaRef.current?.focus();
			}, 300);
		}
	}, [autoFocus, changeSetId, isCreatingNewVersion]);

	// Handle key down in the comment textarea
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();

			// For latest changes, we need to handle comments differently if preventCheckpointOnEnter is true
			if (
				changeSetId.startsWith("latest-changes") &&
				preventCheckpointOnEnter
			) {
				// Add comment to latest changes without creating a checkpoint
				addLatestChangesComment(changeSetId, newComments[changeSetId] || "");
			} else {
				// Regular comment handling
				addComment(changeSetId);
			}
		}
	};

	// For latest changes, we might not have a change set in the regular list
	// Get comments from either the change set or the latestChangesComments
	const comments = changeSetId.startsWith("latest-changes")
		? latestChangesComments[changeSetId] || []
		: changeSet?.comments || [];

	const hasComments = comments.length > 0;

	return (
		<div className="p-3">
			{hasComments ? (
				<div className="mb-3">
					<div className="space-y-1">
						{comments.map((comment) => (
							<Comment key={comment.id} comment={comment} />
						))}
					</div>
				</div>
			) : (
				<div className="mb-3">
					<div className="text-xs text-muted-foreground">
						No comments yet. Be the first to comment!
					</div>
				</div>
			)}

			<div className="relative mb-3">
				<Textarea
					ref={textareaRef}
					placeholder={placeholderText}
					className="min-h-[60px] w-full border rounded-sm p-2 text-sm pr-8 pb-6"
					value={newComments[changeSetId] || ""}
					onChange={(e) => handleCommentChange(changeSetId, e.target.value)}
					onKeyDown={handleKeyDown}
				/>
				<div className="absolute bottom-2 right-2 text-xs text-muted-foreground flex items-center">
					<span className="border rounded-sm px-1 mr-1 text-[10px] border-gray-300">
						⏎
					</span>
					<span>to submit</span>
				</div>
			</div>

			<div className="flex justify-end">
				{customActions
					? customActions
					: !hideSubmitButton && (
							<Button
								size="sm"
								className="border rounded-sm px-3 py-1 text-xs"
								onClick={() => {
									if (
										changeSetId.startsWith("latest-changes") &&
										preventCheckpointOnEnter
									) {
										// Add comment to latest changes without creating a checkpoint
										addLatestChangesComment(
											changeSetId,
											newComments[changeSetId] || "",
										);
									} else {
										// Regular comment handling
										addComment(changeSetId);
									}
								}}
							>
								Submit
							</Button>
						)}
			</div>
		</div>
	);
}
