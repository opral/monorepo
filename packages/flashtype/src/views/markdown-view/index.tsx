import { Suspense, useEffect } from "react";
import type { ReactNode } from "react";
import { useQueryTakeFirst } from "@lix-js/react-utils";
import { useKeyValue } from "@/hooks/key-value/use-key-value";
import { EditorProvider } from "@/views/markdown-view/editor/editor-context";
import { TipTapEditor } from "@/views/markdown-view/editor/tip-tap-editor";
import { Loader2 } from "lucide-react";
import "./style.css";

type MarkdownViewProps = {
	readonly fileId?: string;
	readonly filePath?: string;
};

/**
 * Embeds the shared TipTap editor to render Markdown documents.
 *
 * @example
 * <MarkdownView fileId="file-123" filePath="/docs/guide.md" />
 */
export function MarkdownView({ fileId, filePath }: MarkdownViewProps) {
	return (
		<Suspense fallback={<MarkdownLoadingSpinner />}>
			<MarkdownViewContent fileId={fileId} filePath={filePath} />
		</Suspense>
	);
}

function MarkdownViewContent({ fileId, filePath }: MarkdownViewProps) {
	const [activeFileId, setActiveFileId] = useKeyValue(
		"flashtype_active_file_id",
	);

	const fileRow = useQueryTakeFirst(
		({ lix }) =>
			lix.db
				.selectFrom("file")
				.select(["id", "path"])
				.where(fileId ? "id" : "path", "=", fileId ?? filePath ?? "")
				.limit(1),
		{ subscribe: false },
	);

	useEffect(() => {
		if (!fileRow?.id) return;
		if (activeFileId === fileRow.id) return;
		void setActiveFileId(fileRow.id);
	}, [fileRow?.id, activeFileId, setActiveFileId]);

	let content: ReactNode;
	const hasTarget = Boolean(fileId || filePath);

	if (!hasTarget) {
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

function MarkdownLoadingSpinner(): ReactNode {
	return (
		<div className="flex h-full items-center justify-center px-3 py-2 text-muted-foreground">
			<div className="flex items-center gap-2 text-sm">
				<Loader2 className="h-4 w-4 animate-spin" aria-hidden />
				<span>Loading editor…</span>
			</div>
		</div>
	);
}
