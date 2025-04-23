import { type Comment } from "@lix-js/sdk";
import { useRef, useState, forwardRef, useImperativeHandle } from "react";
import { useQuery } from "../hooks/useQuery";
import { selectDiscussion } from "../queries";
import { createComment, createDiscussion } from "@lix-js/sdk";
import { lix } from "../state";
import { getInitials } from "../utilities/nameUtils";
import { toRelativeTime } from "../utilities/timeUtils";

export interface DiscussionHandle {
	getCommentText: () => string;
	clearCommentText: () => void;
}

interface DiscussionProps {
	changeSetId: string;
	placeholderText?: string;
}

export const Discussion = forwardRef<DiscussionHandle, DiscussionProps>(({
	changeSetId,
	placeholderText = "Add a comment...",
}, ref) => {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [commentText, setCommentText] = useState("");

	const [discussion] = useQuery(() => selectDiscussion({ changeSetId }));

	// Expose methods to parent components
	useImperativeHandle(ref, () => ({
		getCommentText: () => commentText,
		clearCommentText: () => setCommentText("")
	}));

	const handleAddComment = async () => {
		if (!commentText.trim()) return;

		try {
			// If there's no discussion, create a new one
			if (!discussion) {
				await createDiscussion({
					lix,
					changeSet: {
						id: changeSetId!,
					},
					firstComment: {
						content: commentText,
					},
				});
			} else {
				// Add to existing discussion
				const lastComment = discussion.comments[discussion.comments.length - 1];

				if (!lastComment) {
					throw new Error("No existing comments found");
				}

				await createComment({
					lix,
					parentComment: lastComment,
					content: commentText,
				});
			}

			// Clear the input field
			setCommentText("");
		} catch (error) {
			console.error("Error adding comment:", error);
		}
	};

	// Handle key down in the comment textarea
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleAddComment();
		}
	};

	const hasComments = discussion?.comments?.length ?? 0 > 0;

	return (
		<div>
			{hasComments ? (
				<div className="p-2">
					<div className="space-y-4">
						{discussion?.comments?.map((comment) => (
							<Comment key={comment.id} {...comment} />
						))}
					</div>
				</div>
			) : (
				<div className="p-2">
					<div className="text-xs text-muted-foreground">
						No comments yet. Be the first to comment!
					</div>
				</div>
			)}

			<div className="relative mb-3 mt-2">
				<textarea
					ref={textareaRef}
					placeholder={placeholderText}
					className="input min-h-[60px] w-full border rounded-sm p-2 text-sm pr-8 pb-6"
					onKeyDown={handleKeyDown}
					value={commentText}
					onChange={(e) => setCommentText(e.target.value)}
				/>
				<div className="absolute bottom-2 right-2 text-xs text-muted-foreground flex items-center">
					<span className="border rounded-sm px-1 mr-1 text-[10px] border-gray-300">
						⏎
					</span>
					<span>to submit</span>
				</div>
			</div>
		</div>
	);
});

function Comment(props: {
	id: string;
	author_name: string;
	created_at: string;
	content: string;
}) {
	return (
		<div>
			<div className="flex items-start gap-2 mb-1">
				<div className="avatar avatar-placeholder">
					<div className="w-6 h-6 rounded-full bg-base-300 text-base-content">
						<span className="text-xs font-bold">
							{getInitials(props.author_name)}
						</span>
					</div>
				</div>
				<div className="flex-1">
					<div className="flex items-baseline justify-between">
						<span className="text-xs font-medium">{props.author_name}</span>
						<span className="text-xs text-muted-foreground ml-2">
							{toRelativeTime(props.created_at)}
						</span>
					</div>
					<div className="text-xs mt-1">{props.content}</div>
				</div>
			</div>
		</div>
	);
}
