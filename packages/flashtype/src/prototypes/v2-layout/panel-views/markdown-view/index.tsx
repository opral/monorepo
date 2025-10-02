import { useEffect } from "react";
import { useQueryTakeFirst } from "@lix-js/react-utils";
import { useKeyValue } from "@/key-value/use-key-value";
import { EditorProvider } from "@/editor/editor-context";
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

	if (!filePath) {
		return (
			<div className="flex h-full items-center justify-center px-4 py-6 text-sm text-neutral-500">
				Select a Markdown file to preview.
			</div>
		);
	}

	if (!fileRow) {
		return (
			<div className="flex h-full items-center justify-center px-4 py-6 text-sm text-neutral-500">
				File not found in the workspace.
			</div>
		);
	}

	return (
		<EditorProvider>
			<div className="markdown-view h-full">
				<TipTapEditor className="h-full" />
			</div>
		</EditorProvider>
	);
}
