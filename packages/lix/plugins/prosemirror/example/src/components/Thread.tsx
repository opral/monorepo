import { useState } from "react";
import { Lix, type Thread, type ThreadComment } from "@lix-js/sdk";
import { fromPlainText, toPlainText, ZettelDoc } from "@lix-js/sdk/zettel-ast";
import { toRelativeTime } from "../utilities/timeUtils";
import { getInitials } from "../utilities/nameUtils";

export function Thread(props: {
	lix: Lix;
	thread: Thread;
	comments: Array<
		Pick<ThreadComment, "id" | "lixcol_created_at" | "body"> & {
			author_name: string;
		}
	>;
	onComposerSubmit: (args: { body: ZettelDoc }) => void;
}) {
	// Handler for adding a new comment to THIS thread
	const handleCommentSubmit = async (args: { body: ZettelDoc }) => {
		await props.lix.db
			.insertInto("thread_comment")
			.values({
				body: args.body,
				thread_id: props.thread.id,
			})
			.execute();
	};

	return (
		<div className="py-1">
			<div className="p-2">
				<div className="space-y-4">
					{props.comments.map((comment) => (
						<ThreadComment key={comment.id} lix={props.lix} comment={comment} />
					))}
				</div>
			</div>

			<Composer
				lix={props.lix}
				threadId={props.thread.id}
				onComposerSubmit={handleCommentSubmit}
			/>
		</div>
	);
}

export function Composer(props: {
	lix: Lix;
	threadId?: Thread["id"];
	onComposerSubmit: (args: { body: ZettelDoc }) => void;
}) {
	const [value, setValue] = useState<string | undefined>(undefined);

	const handleSubmitClick = () => {
		// Use optional chaining for safe access and check text content
		if (value !== "") {
			props.onComposerSubmit({ body: fromPlainText(value!) });
			setValue(undefined);
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault(); // Prevent newline
			handleSubmitClick(); // Trigger submission
		}
	};

	return (
		<div>
			{/* Container for editor and visual cue */}
			<div className="relative mb-1 border border-gray-300 rounded-sm p-2 pr-16 pb-6">
				<textarea
					value={value}
					onChange={(e) => setValue(e.target.value)}
					className="outline-none min-h-[60px] text-sm"
					placeholder="Add a comment..."
					onKeyDown={handleKeyDown}
				/>
				{/* Add visual cue */}
				<div className="absolute bottom-1 right-2 text-xs text-muted-foreground flex items-center pointer-events-none">
					<span className="border rounded-sm px-1 mr-1 text-[10px] border-gray-300">
						⏎
					</span>
					<span>to submit</span>
				</div>
			</div>
		</div>
	);
}

function ThreadComment(props: {
	lix: Lix;
	comment: Pick<ThreadComment, "lixcol_created_at" | "body"> & {
		author_name: string;
	};
}) {
	return (
		<div>
			<div className="flex items-start gap-2 mb-1">
				<div className="avatar avatar-placeholder">
					<div className="w-6 h-6 rounded-full bg-base-300 text-base-content">
						<span className="text-xs font-bold">
							{getInitials(props.comment.author_name)}
						</span>
					</div>
				</div>
				<div className="flex-1">
					<div className="flex items-baseline justify-between">
						<span className="text-xs font-medium">
							{props.comment.author_name}
						</span>
						<span className="text-xs text-muted-foreground ml-2">
							{toRelativeTime(props.comment.lixcol_created_at)}
						</span>
					</div>
					<div className="text-xs mt-1">{toPlainText(props.comment.body)}</div>
				</div>
			</div>
		</div>
	);
}
