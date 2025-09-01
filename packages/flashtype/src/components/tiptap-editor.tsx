import * as React from "react";
import { useEffect, use as usePromise } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { AstSchemas } from "@opral/markdown-wc";
import {
	markdownWcExtensions,
	astToTiptapDoc,
	tiptapDocToAst,
} from "@opral/markdown-wc/tiptap";
import { useEditorCtx } from "../editor/editor-context";
import { useLix, useQueryTakeFirst } from "@lix-js/react-utils";
import { nanoId } from "@lix-js/sdk";
import { useKeyValue } from "../key-value/use-key-value";
import { plugin as mdPlugin } from "@lix-js/plugin-md-v2";
import { assembleMdAst } from "../utils/assemble-md-ast";

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

	const { setEditor, editor: ctxEditor } = useEditorCtx();

	const [activeFileId] = useKeyValue("flashtype_active_file_id");

	const activeFile = useQueryTakeFirst((lix) =>
		lix.db
			.selectFrom("file")
			.select(["id", "path", "data"])
			.orderBy("path", "asc")
			.where("id", "=", activeFileId),
	);

	const persistTimerRef = React.useRef<number | null>(null);
	const isDisposedRef = React.useRef(false);
	const inFlightRef = React.useRef(false);
	const pendingRef = React.useRef(false);

	const PERSIST_DEBOUNCE_MS = persistDebounceMs ?? 200;

	// Helpers kept local for minimal surface and fresh closures per render
	function ensureTopLevelIds(children: any[]): string[] {
		const order: string[] = [];
		for (const node of children) {
			node.data = node.data || {};
			if (!node.data.id) node.data.id = nanoId({ lix, length: 10 });
			order.push(node.data.id as string);
		}
		return order;
	}

	async function upsertNodes(trx: any, fileId: string, nodes: any[]) {
		for (const node of nodes) {
			const schema = (AstSchemas.schemasByType as any)[node.type];
			if (!schema) continue;
			const schemaKey = schema["x-lix-key"] as string;
			const schemaVersion = schema["x-lix-version"] as string;
			const entityId = node.data.id as string;

			const existing = await trx
				.selectFrom("state")
				.where("file_id", "=", fileId as any)
				.where("schema_key", "=", schemaKey)
				.where("entity_id", "=", entityId)
				.select(["entity_id"]) // small row
				.executeTakeFirst();

			if (existing) {
				await trx
					.updateTable("state")
					.set({ snapshot_content: node as any })
					.where("file_id", "=", fileId as any)
					.where("schema_key", "=", schemaKey)
					.where("entity_id", "=", entityId)
					.execute();
			} else {
				await trx
					.insertInto("state")
					.values({
						entity_id: entityId,
						file_id: fileId as any,
						schema_key: schemaKey,
						schema_version: schemaVersion,
						plugin_key: mdPlugin.key,
						snapshot_content: node as any,
					})
					.execute();
			}
		}
	}

	// Removed paragraph-specific upsert; all top-level nodes are treated uniformly

	async function upsertRootOrder(trx: any, fileId: string, order: string[]) {
		const rootKey = (AstSchemas.RootOrderSchema as any)["x-lix-key"] as string;
		const rootVersion = (AstSchemas.RootOrderSchema as any)[
			"x-lix-version"
		] as string;
		const existingRoot = await trx
			.selectFrom("state")
			.where("file_id", "=", fileId as any)
			.where("schema_key", "=", rootKey)
			.select(["entity_id"]) // small row
			.executeTakeFirst();

		if (existingRoot) {
			await trx
				.updateTable("state")
				.set({ snapshot_content: { order } })
				.where("file_id", "=", fileId as any)
				.where("schema_key", "=", rootKey)
				.execute();
		} else {
			await trx
				.insertInto("state")
				.values({
					entity_id: "root",
					file_id: fileId as any,
					schema_key: rootKey,
					schema_version: rootVersion,
					plugin_key: mdPlugin.key,
					snapshot_content: { order },
				})
				.execute();
		}
	}

	async function runPersist(ed: any) {
		if (isDisposedRef.current) return;
		if (!ctxEditor || ed !== (ctxEditor as any)) return;
		if (inFlightRef.current) {
			pendingRef.current = true;
			return;
		}
		inFlightRef.current = true;
		try {
			// Compute latest AST snapshot
			const latestAst = tiptapDocToAst(ed.getJSON() as any) as any;
			const children: any[] = Array.isArray(latestAst?.children)
				? (latestAst.children as any[])
				: [];
			const fileId = activeFile!.id as any as string;
			const order = ensureTopLevelIds(children);

			await lix.db.transaction().execute(async (trx) => {
				await upsertNodes(trx, fileId, children);
				await upsertRootOrder(trx, fileId, order);

				// Remove stale entities that are no longer present in the current root order
				const keepIds = [...order, "root"];
				if (keepIds.length > 0) {
					await trx
						.deleteFrom("state")
						.where("file_id", "=", fileId as any)
						.where("plugin_key", "=", mdPlugin.key)
						.where("entity_id", "not in", keepIds as any)
						.execute();
				} else {
					// Order is empty: remove all rows for this plugin/file except the 'root' row.
					// This preserves the RootOrder entity while clearing stale block entities.
					await trx
						.deleteFrom("state")
						.where("file_id", "=", fileId as any)
						.where("plugin_key", "=", mdPlugin.key)
						.where("entity_id", "<>", "root")
						.execute();
				}
			});
		} finally {
			inFlightRef.current = false;
			if (pendingRef.current) {
				pendingRef.current = false;
				persistTimerRef.current = window.setTimeout(() => {
					// immediately schedule another persist to flush queued change
					void runPersist(ed);
				}, 0);
			}
		}
	}

	function schedulePersist(ed: any, delay = PERSIST_DEBOUNCE_MS) {
		if (persistTimerRef.current) window.clearTimeout(persistTimerRef.current);
		persistTimerRef.current = window.setTimeout(() => {
			void runPersist(ed);
		}, delay);
	}

	// Build initial AST from Lix state (Suspense)
	const initialAst = usePromise(
		React.useMemo(
			() => assembleMdAst({ lix, fileId: activeFile?.id }),
			[lix, activeFile?.id],
		),
	);

	const editor = useEditor(
		{
			extensions: markdownWcExtensions({
				idProvider: () => nanoId({ lix, length: 10 }),
			}),
			content: astToTiptapDoc(initialAst) as any,
			onCreate: ({ editor }) => {
				// Expose editor as early as possible for tests and UI
				setEditor(editor as any);
				onReady?.(editor as any);
			},
			onUpdate: ({ editor }) => {
				const ast = tiptapDocToAst(editor.getJSON() as any);
				onAstChange?.(ast);

				// Ownership guard: only the active editor instance may persist
				if (!ctxEditor || editor !== (ctxEditor as any)) {
					return;
				}

				if (!activeFile?.id) return;
				schedulePersist(editor);
			},
		},
		[activeFile?.id],
	);

	useEffect(() => {
		if (!editor) return;
		isDisposedRef.current = false;
		setEditor(editor as any);
		return () => {
			isDisposedRef.current = true;
			if (persistTimerRef.current) {
				window.clearTimeout(persistTimerRef.current);
				persistTimerRef.current = null;
			}
			try {
				(editor as any)?.destroy?.();
			} catch {}
			setEditor(null);
		};
	}, [editor, setEditor]);

	return (
		<div className={className} style={{ height: "100%" }}>
			<div className="w-full h-full bg-background p-3">
				<EditorContent
					editor={editor}
					className="w-full h-full max-w-5xl mx-auto"
					data-testid="tiptap-editor"
				/>
			</div>
		</div>
	);
}
