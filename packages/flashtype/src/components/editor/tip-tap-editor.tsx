import { useEffect, use as usePromise, useMemo } from "react";
import { EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import { useEditorCtx } from "../../editor/editor-context";
import { useLix } from "@lix-js/react-utils";
import { useQuery } from "@lix-js/react-utils";
import { useKeyValue } from "../../key-value/use-key-value";
import { createEditor } from "./create-editor";
import { assembleMdAst } from "./assemble-md-ast";
import { astToTiptapDoc } from "@opral/markdown-wc/tiptap";

type TipTapEditorProps = {
	className?: string;
	onReady?: (editor: Editor) => void;
	persistDebounceMs?: number;
};

export function TipTapEditor({
	className,
	onReady,
	persistDebounceMs,
}: TipTapEditorProps) {
	const lix = useLix();

	const { setEditor } = useEditorCtx();
	const [activeFileId] = useKeyValue("flashtype_active_file_id");

	const PERSIST_DEBOUNCE_MS = persistDebounceMs ?? 200;

	if (!activeFileId) {
		throw new Error(
			"TipTapEditor: 'flashtype_active_file_id' is undefined. Set the active file id before rendering the editor.",
		);
	}
	// Editor loads initial content and persists via createEditor using only fileId

	const writerKey = `flashtype_tiptap_editor`;

	const editor = usePromise(
		useMemo(
			() =>
				createEditor({
					lix,
					fileId: activeFileId,
					persistDebounceMs: PERSIST_DEBOUNCE_MS,
					writerKey,
				}),
			[lix, activeFileId, PERSIST_DEBOUNCE_MS, writerKey],
		),
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
		setEditor(editor as any);
		onReady?.(editor as any);
	}, [editor, setEditor, onReady]);

	return (
		<div className={className ?? undefined}>
			<div className="w-full bg-background px-3 py-0">
				<EditorContent
					editor={editor as any}
					className="w-full max-w-5xl mx-auto"
					data-testid="tiptap-editor"
					key={activeFileId ?? "no-file"}
				/>
			</div>
		</div>
	);
}
