import { Suspense, useEffect } from "react";
import type { ReactNode } from "react";
import { FileText, Loader2 } from "lucide-react";
import { LixProvider, useQueryTakeFirst } from "@lix-js/react-utils";
import { useKeyValue } from "@/hooks/key-value/use-key-value";
import { EditorProvider } from "@/views/markdown-view/editor/editor-context";
import { TipTapEditor } from "@/views/markdown-view/editor/tip-tap-editor";
import "./style.css";
import { createReactViewDefinition } from "../../app/react-view";
import { FILE_VIEW_KIND } from "../../app/view-instance-helpers";
import { FormattingToolbar } from "./components/formatting-toolbar";

type MarkdownViewProps = {
	readonly fileId?: string;
	readonly filePath?: string;
	readonly isActiveView?: boolean;
};

/**
 * Embeds the shared TipTap editor to render Markdown documents.
 *
 * @example
 * <MarkdownView fileId="file-123" filePath="/docs/guide.md" isActiveView />
 */
export function MarkdownView({
	fileId,
	filePath,
	isActiveView = true,
}: MarkdownViewProps) {
	return (
		<Suspense fallback={<MarkdownLoadingSpinner />}>
			<MarkdownViewContent
				fileId={fileId}
				filePath={filePath}
				isActiveView={isActiveView}
			/>
		</Suspense>
	);
}

function MarkdownViewContent({
	fileId,
	filePath,
	isActiveView = true,
}: MarkdownViewProps) {
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
		if (!isActiveView) return;
		if (activeFileId === fileRow.id) return;
		void setActiveFileId(fileRow.id);
	}, [fileRow?.id, activeFileId, setActiveFileId, isActiveView]);

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
				<div className="markdown-view flex h-full flex-col bg-background">
					<FormattingToolbar className="mb-3" />
					<TipTapEditor className="flex-1" fileId={fileRow.id} />
				</div>
			</EditorProvider>
		);
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col px-2 py-2">{content}</div>
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

/**
 * Markdown content view definition used by the registry.
 *
 * @example
 * import { view as markdownView } from "@/views/markdown-view";
 */
export const view = createReactViewDefinition({
	kind: FILE_VIEW_KIND,
	label: "File",
	description: "Display file contents.",
	icon: FileText,
	component: ({ context, instance }) => (
		<LixProvider lix={context.lix}>
			<MarkdownView
				fileId={instance.props?.fileId}
				filePath={instance.props?.filePath}
				isActiveView={context.isActiveView ?? false}
			/>
		</LixProvider>
	),
});
