import * as React from "react";
import { use as usePromise } from "react";
import { EditorContent } from "@tiptap/react";
import { parseMarkdown } from "@opral/markdown-wc";
import { useEditorCtx } from "../../editor/editor-context";
import { useLix, useQueryTakeFirst } from "@lix-js/react-utils";
import { useKeyValue } from "../../key-value/use-key-value";
import { assembleMdAst } from "./assemble-md-ast";
import { createEditor } from "./create-editor";

type TipTapEditorProps = {
	onAstChange?: (ast: any) => void;
	className?: string;
	onReady?: (editor: any) => void;
	persistDebounceMs?: number;
};

export function TipTapEditor({
	onAstChange,
	className,
	onReady,
	persistDebounceMs,
}: TipTapEditorProps) {
	const lix = useLix();

	const { setEditor } = useEditorCtx();

	const [activeFileId] = useKeyValue("flashtype_active_file_id");

	const activeFile = useQueryTakeFirst((lix) =>
		lix.db
			.selectFrom("file")
			.select(["id", "path", "data"])
			.orderBy("path", "asc")
			.where("id", "=", activeFileId),
	);

	const PERSIST_DEBOUNCE_MS = persistDebounceMs ?? 200;

	const initialAst = usePromise(
		React.useMemo(
			() => assembleMdAst({ lix, fileId: activeFile?.id }),
			[lix, activeFile?.id],
		),
	);

	// Fallback: if no state yet, parse the file's markdown directly
	const fallbackAst = React.useMemo(() => {
		try {
			const bytes = (activeFile as any)?.data as Uint8Array | undefined;
			if (!bytes || bytes.byteLength === 0) return null;
			const md = new TextDecoder().decode(bytes);
			if (!md) return null;
			return parseMarkdown(md) as any;
		} catch {
			return null;
		}
	}, [activeFile?.data]);

	const contentAst = React.useMemo(() => {
		const hasState = Array.isArray((initialAst as any)?.children) &&
			(initialAst as any).children.length > 0;
		if (hasState) return initialAst as any;
		const hasFile = Array.isArray((fallbackAst as any)?.children) &&
			(fallbackAst as any).children.length > 0;
		if (hasFile) return fallbackAst as any;
		return { type: "root", children: [] } as any;
	}, [initialAst, fallbackAst]);

    const [editor, setLocalEditor] = React.useState<any>(null);

    React.useEffect(() => {
        let disposed = false;
        let created: any = null;
        (async () => {
            created = await createEditor({
                lix,
                contentAst,
                fileId: activeFile?.id,
                persistDebounceMs: PERSIST_DEBOUNCE_MS,
                onCreate: ({ editor }) => {
                    setEditor(editor as any);
                    onReady?.(editor as any);
                },
                onAstChange: (ast: any) => onAstChange?.(ast),
            });
            if (!disposed) setLocalEditor(created);
        })();
        return () => {
            disposed = true;
            try {
                (created as any)?.destroy?.();
            } catch {}
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeFile?.id, JSON.stringify(contentAst)]);

	// no-op: editor lifecycle handled in the createEditor effect above

	return (
		<div className={className} style={{ height: "100%" }}>
			<div className="w-full h-full bg-background p-3">
			<EditorContent
				editor={editor as any}
					className="w-full h-full max-w-5xl mx-auto"
					data-testid="tiptap-editor"
				/>
			</div>
		</div>
	);
}
