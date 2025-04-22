import { useState } from "react";
import {
	defineSchema,
	EditorProvider,
	PortableTextEditable,
	EditorEmittedEvent,
} from "@portabletext/editor";
import type { PortableTextBlock } from "@portabletext/editor";
import { EventListenerPlugin } from "@portabletext/editor/plugins";
import { PortableText } from "@portabletext/react";
import { Lix, type Thread, type ThreadComment } from "@lix-js/sdk";
import { toRelativeTime } from "../utilities/timeUtils";
import { getInitials } from "../utilities/nameUtils";

const schemaDefinition = defineSchema({
	decorators: [{ name: "strong" }, { name: "em" }],
	styles: [{ name: "normal" }],
	annotations: [],
	lists: [],
	inlineObjects: [],
	blockObjects: [],
});

export function Thread(props: {
	lix: Lix;
	thread: Thread;
	comments: Array<ThreadComment & { author_name: string; created_at: string }>;
	onComposerSubmit: (args: { content: PortableTextBlock[] }) => void;
}) {
	console.log("Thread props:", props);

	// Handler for adding a new comment to THIS thread
	const handleCommentSubmit = async (args: {
		content: PortableTextBlock[];
	}) => {
		await props.lix.db
			.insertInto("thread_comment")
			.values({
				content: args.content,
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
	onComposerSubmit: (args: { content: PortableTextBlock[] }) => void;
}) {
	const [value, setValue] = useState<PortableTextBlock[] | undefined>(
		undefined,
	);

	const handleSubmitClick = () => {
		// Use optional chaining for safe access and check text content
		if (value?.[0]?.children?.[0]?.text !== "") {
			props.onComposerSubmit({ content: value! });
			// Resetting the editor state might need a different approach with PortableTextEditor
			// For now, just clearing the local state
			setValue(undefined);
			// Need a way to clear the editor instance itself if possible
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault(); // Prevent newline
			handleSubmitClick(); // Trigger submission
		}
	};

	return (
		<EditorProvider
			initialConfig={{
				schemaDefinition: schemaDefinition,
			}}
		>
			<EventListenerPlugin
				on={(event: EditorEmittedEvent) => {
					if (event.type === "mutation") {
						// The event directly provides the new value
						setValue(event.value);
					}
				}}
			/>

			{/* Container for editor and visual cue */}
			<div className="relative mb-1 border border-gray-300 rounded-sm p-2 pr-16 pb-6">
				<PortableTextEditable
					className="outline-none min-h-[60px] text-sm"
					placeholder="Add a comment..."
					onKeyDown={handleKeyDown} // Attach the handler
				/>
				{/* Add visual cue */}
				<div className="absolute bottom-1 right-2 text-xs text-muted-foreground flex items-center pointer-events-none">
					<span className="border rounded-sm px-1 mr-1 text-[10px] border-gray-300">
						⏎
					</span>
					<span>to submit</span>
				</div>
			</div>
		</EditorProvider>
	);
}

function ThreadComment(props: {
	lix: Lix;
	comment: ThreadComment & { author_name: string; created_at: string };
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
							{toRelativeTime(props.comment.created_at)}
						</span>
					</div>
					<div className="text-xs mt-1">
						<PortableText
							value={props.comment.content as PortableTextBlock[]}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
