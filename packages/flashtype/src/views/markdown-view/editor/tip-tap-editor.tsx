import { useCallback, useEffect, useMemo, useState } from "react";
import { EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import { useEditorCtx } from "./editor-context";
import { useLix, useQuery, useQueryTakeFirst } from "@lix-js/react-utils";
import { useKeyValue } from "@/hooks/key-value/use-key-value";
import { createEditor } from "./create-editor";
import { assembleMdAst } from "./assemble-md-ast";
import { astToTiptapDoc } from "@opral/markdown-wc/tiptap";

type TipTapEditorProps = {
	fileId?: string | null;
	className?: string;
	onReady?: (editor: Editor) => void;
	persistDebounceMs?: number;
};

/**
 * Rich text editor for Markdown files backed by the Lix store.
 *
 * Loads the active file lazily, keeps the ProseMirror instance in sync with
 * remote changes, and persists edits via the collaborative Lix writer.
 *
 * @example
 * <TipTapEditor
 *   fileId="file-123"
 *   className="grow"
 *   onReady={(editor) => editor.commands.focus()}
 * />
 */
export function TipTapEditor({
	fileId,
	className,
	onReady,
	persistDebounceMs,
}: TipTapEditorProps) {
	const lix = useLix();
	const [activeFileIdKV] = useKeyValue("flashtype_active_file_id");
	const activeFileId = fileId ?? activeFileIdKV;
	const initialFile = useQueryTakeFirst(
		({ lix }) =>
			lix.db
				.selectFrom("file")
				.select("data")
				.where("id", "=", activeFileId ?? ""),
		{ subscribe: false },
	);
	const initialMarkdown = useMemo(() => {
		if (!initialFile?.data) return "";
		return new TextDecoder().decode(initialFile.data);
	}, [initialFile]);

	const { setEditor } = useEditorCtx();

	const PERSIST_DEBOUNCE_MS = persistDebounceMs ?? 200;
	const writerKey = `flashtype_tiptap_editor`;

	const [initialAst, setInitialAst] = useState<any | null>(null);
	const [initialAstLoaded, setInitialAstLoaded] = useState(false);

	const editor = useMemo(() => {
		if (!activeFileId || !initialFile || !initialAstLoaded) return null;
		// Prefer persisted AST (already contains plugin-issued data.id values) so we never churn ids
		// when opening an existing markdown document.
		const hasStateSnapshot =
			Array.isArray(initialAst?.children) && initialAst.children.length > 0;
		return createEditor({
			lix,
			initialMarkdown,
			contentAst: hasStateSnapshot ? initialAst : undefined,
			fileId: activeFileId,
			persistDebounceMs: PERSIST_DEBOUNCE_MS,
			writerKey,
		});
	}, [
		lix,
		activeFileId,
		PERSIST_DEBOUNCE_MS,
		writerKey,
		initialFile,
		initialAst,
		initialAstLoaded,
		initialMarkdown,
	]);

	const [isEditorFocused, setIsEditorFocused] = useState(false);

	useEffect(() => {
		if (!editor) return;
		const syncFocus = () => setIsEditorFocused(editor.isFocused);
		syncFocus();
		editor.on("focus", syncFocus);
		editor.on("blur", syncFocus);
		return () => {
			editor.off("focus", syncFocus);
			editor.off("blur", syncFocus);
		};
	}, [editor]);

	const handleSurfacePointerDown = useCallback(
		(event: React.MouseEvent<HTMLDivElement>) => {
			if (!editor) return;
			const target = event.target as HTMLElement | null;
			const insideContent = target?.closest(".ProseMirror");
			if (insideContent) return;
			event.preventDefault();
			if (editor.isEmpty) {
				editor.commands.focus("start");
			} else {
				editor.commands.focus("end");
			}
		},
		[editor],
	);

	// Subscribe to commit events and refresh on external changes
	useEffect(() => {
		if (!activeFileId || !editor) return;
		const unsubscribe = lix.hooks.onStateCommit(({ changes }) => {
			// External: writer_key is null or different from our writer
			const hasExternal = changes?.some(
				(c) =>
					c.file_id === activeFileId &&
					(c.writer_key == null || c.writer_key !== writerKey),
			);
			if (hasExternal) {
				assembleMdAst({ lix, fileId: activeFileId }).then((ast) =>
					editor.commands.setContent(astToTiptapDoc(ast)),
				);
			}
		});
		return () => unsubscribe();
	}, [lix, editor, activeFileId, writerKey]);

	// Watch active version to refresh on version switches
	const activeVersionRow = useQuery(() =>
		lix.db.selectFrom("active_version").select(["version_id"]).limit(1),
	);
	const activeVersionId =
		Array.isArray(activeVersionRow) && activeVersionRow.length > 0
			? activeVersionRow[0]?.version_id
			: ((activeVersionRow as any)?.version_id ?? null);

	useEffect(() => {
		let cancelled = false;
		if (!activeFileId) {
			setInitialAst(null);
			setInitialAstLoaded(true);
			return;
		}
		// Load the assembled AST snapshot from state so persisted ids are preserved. When the file has
		// never been persisted before (brand-new doc), assembleMdAst returns an empty root which cues
		// the editor to parse markdown and mint ids during the first persist cycle.
		setInitialAstLoaded(false);
		(async () => {
			const ast = await assembleMdAst({ lix, fileId: activeFileId });
			if (cancelled) return;
			setInitialAst(ast);
			setInitialAstLoaded(true);
		})();
		return () => {
			cancelled = true;
		};
	}, [lix, activeFileId, activeVersionId]);

	useEffect(() => {
		if (!editor || !activeFileId) return;
		let cancelled = false;
		(async () => {
			const ast = await assembleMdAst({ lix, fileId: activeFileId });
			if (cancelled) return;
			editor.commands.setContent(astToTiptapDoc(ast));
		})();
		return () => {
			cancelled = true;
		};
	}, [editor, lix, activeFileId, activeVersionRow]);

	useEffect(() => {
		if (!editor) return;
		setEditor(editor);
		onReady?.(editor);
	}, [editor, setEditor, onReady]);

	if (!activeFileId) {
		return (
			<div className={className ?? undefined}>
				<div className="flex h-full min-h-[200px] items-center justify-center bg-background px-3 py-12">
					<p className="text-sm text-muted-foreground">
						Select a file to start writing.
					</p>
				</div>
			</div>
		);
	}

	if (!editor) {
		return (
			<div className={className ?? undefined}>
				<div className="w-full bg-background px-3 py-12">
					<div className="mx-auto h-48 w-full max-w-5xl animate-pulse rounded-md bg-muted" />
				</div>
			</div>
		);
	}

	return (
		<div className={`min-h-0 ${className ?? ""}`}>
			<div
				className="tiptap-container w-full h-full bg-background py-0 cursor-text overflow-y-auto"
				data-editor-focused={isEditorFocused ? "true" : "false"}
				onMouseDown={handleSurfacePointerDown}
			>
				<EditorContent
					editor={editor}
					className="tiptap w-full max-w-5xl mx-auto"
					data-testid="tiptap-editor"
					key={activeFileId ?? "no-file"}
				/>
			</div>
		</div>
	);
}
