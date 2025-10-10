import { useEffect } from "react";
import type { ReactNode } from "react";
import { useQueryTakeFirst } from "@lix-js/react-utils";
import { useKeyValue } from "@/hooks/key-value/use-key-value";
import { EditorProvider } from "@/components/editor/editor-context";
import { TipTapEditor } from "@/components/editor/tip-tap-editor";
import "./style.css";

type MarkdownViewProps = {
	readonly filePath?: string;
};

/**
 * Embeds the shared TipTap editor to render Markdown documents.
 *
 * @example
 * <MarkdownView filePath="/docs/guide.md" />
 */
export function MarkdownView({ filePath }: MarkdownViewProps) {
	const [activeFileId, setActiveFileId] = useKeyValue(
		"flashtype_active_file_id",
	);

	const fileRow = useQueryTakeFirst(
		({ lix }) =>
			lix.db
				.selectFrom("file")
				.select(["id", "path"])
				.where("path", "=", filePath ?? "")
				.limit(1),
		{ subscribe: false },
	);

	useEffect(() => {
		if (!fileRow?.id) return;
		if (activeFileId === fileRow.id) return;
		void setActiveFileId(fileRow.id);
	}, [fileRow?.id, activeFileId, setActiveFileId]);

	let content: ReactNode;
	if (!filePath) {
		content = (
			<div className="flex h-full items-center justify-center text-sm text-neutral-500">
				Select a Markdown file to preview.
			</div>
		);
	} else if (!fileRow) {
		content = (
			<div className="flex h-full items-center justify-center text-sm text-neutral-500">
				File not found in the workspace.
			</div>
		);
	} else {
		content = (
			<EditorProvider>
				<div className="markdown-view h-full">
					<TipTapEditor className="h-full" />
				</div>
			</EditorProvider>
		);
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col px-3 py-2">{content}</div>
	);
}
