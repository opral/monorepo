import { use as usePromise, useEffect, useMemo } from "react";
import { EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import { useEditorCtx } from "../../editor/editor-context";
import { useLix } from "@lix-js/react-utils";
import { useQuery } from "@lix-js/react-utils";
import { useKeyValue } from "../../key-value/use-key-value";
import { createEditor } from "./create-editor";
import { sql } from "@lix-js/sdk";
import { assembleMdAst } from "./assemble-md-ast";
import { astToTiptapDoc } from "@opral/markdown-wc/tiptap";
import { plugin } from "@lix-js/plugin-md";

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
			[lix, activeFileId, PERSIST_DEBOUNCE_MS],
		),
	);

	// subscribe to external state changes and version switches
	const externalState = useQuery(() =>
		lix.db
			.selectFrom("state_with_tombstones")
			.where("file_id", "=", activeFileId)
			.where("plugin_key", "=", plugin.key)
			.where(
				"version_id",
				"=",
				lix.db.selectFrom("active_version").select("version_id"),
			)
			// External means: writer_key IS NOT my session writer (NULLs count as external)
			.where(sql`writer_key IS NOT ${writerKey}` as any)
			.select(["writer_key"]),
	);

	useEffect(() => {
		console.log("External STATE", externalState);
	}, [externalState]);

	const activeVersionRow = useQuery(() =>
		lix.db.selectFrom("active_version").select(["version_id"]).limit(1),
	);

	// rebuild the editor content if external changes or a version switch happened
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
	}, [editor, lix, activeFileId, externalState, activeVersionRow]);

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
