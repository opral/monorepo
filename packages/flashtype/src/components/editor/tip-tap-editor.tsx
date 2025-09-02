import { use as usePromise, useEffect, useMemo } from "react";
import { EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import { useEditorCtx } from "../../editor/editor-context";
import { useLix } from "@lix-js/react-utils";
import { useKeyValue } from "../../key-value/use-key-value";
import { createEditor } from "./create-editor";

type TipTapEditorProps = {
	className?: string;
	onReady?: (editor: Editor) => void;
};

export function TipTapEditor({ className, onReady }: TipTapEditorProps) {
	const lix = useLix();

	const { setEditor } = useEditorCtx();
	const [activeFileId] = useKeyValue("flashtype_active_file_id");

	const PERSIST_DEBOUNCE_MS = 200;

	// Require an active file id to operate
	if (!activeFileId) {
		throw new Error(
			"TipTapEditor: 'flashtype_active_file_id' is undefined. Set the active file id before rendering the editor.",
		);
	}

	// Editor loads initial content and persists via createEditor using only fileId

	const editor = usePromise(
		useMemo(
			() =>
				createEditor({
					lix,
					fileId: activeFileId,
					persistDebounceMs: PERSIST_DEBOUNCE_MS,
				}),
			[lix, activeFileId, PERSIST_DEBOUNCE_MS],
		),
	);

	useEffect(() => {
		if (!editor) return;
		setEditor(editor as any);
		onReady?.(editor as any);
		// No cleanup/destroy to test strict-mode stability
	}, [editor, setEditor]);

	return (
		<div className={className} style={{ height: "100%" }}>
			<div className="w-full h-full bg-background p-3">
				<EditorContent
					editor={editor as any}
					className="w-full h-full max-w-5xl mx-auto"
					data-testid="tiptap-editor"
					key={activeFileId ?? "no-file"}
				/>
			</div>
		</div>
	);
}
