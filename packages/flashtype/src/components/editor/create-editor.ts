import { Editor } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import { nanoId, type Lix, withWriterKey } from "@lix-js/sdk";
import {
	MarkdownWc,
	astToTiptapDoc,
	tiptapDocToAst,
} from "@opral/markdown-wc/tiptap";
import { parseMarkdown, AstSchemas } from "@opral/markdown-wc";
import { plugin as mdPlugin } from "../../../../lix/plugin-md/dist";
import { handlePaste as defaultHandlePaste } from "./handle-paste";

type CreateEditorArgs = {
	lix: Lix;
	initialMarkdown?: string;
	contentAst?: any;
	onCreate?: (args: { editor: Editor }) => void;
	onUpdate?: (args: { editor: Editor }) => void;
	editorProps?: any;
	fileId?: string;
	persistDebounceMs?: number;
	persistState?: boolean;
	writerKey?: string | null;
};

// Plain TipTap Editor factory (no React). Useful for unit/integration tests.
export function createEditor(args: CreateEditorArgs): Editor {
	const {
		lix,
		initialMarkdown,
		contentAst,
		onCreate,
		onUpdate,
		editorProps,
		fileId,
		persistDebounceMs,
		persistState = true,
		writerKey,
	} = args;

	const ast = contentAst ?? (parseMarkdown(initialMarkdown ?? "") as any);

	let persistStateTimer: any = null;
	// Serialize persist runs to avoid overlapping transactions causing inconsistent state snapshots.
	let persistRunning = false;
	let persistQueued = false;
	let currentEditor: Editor | null = null;
	const PERSIST_DEBOUNCE_MS = persistDebounceMs ?? 0;

	// Removed markdown file writes; state is the source of truth.

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

	/**
	 * Ensure each top-level block has a stable, unique data.id.
	 * - Assigns a new id if missing.
	 * - Regenerates ids for duplicates (e.g., paragraph split that cloned attrs).
	 */
	async function ensureTopLevelIds(children: any[]): Promise<string[]> {
		const order: string[] = [];
		const seen = new Set<string>();
		for (const node of children) {
			node.data = node.data || {};
			let id = (node.data.id ?? "") as string;
			if (!id || seen.has(id)) {
				id = await nanoId({ lix, length: 10 });
				node.data.id = id;
			}
			seen.add(id);
			order.push(id);
		}
		return order;
	}

	return new Editor({
		extensions: [
			...MarkdownWc({}),
			Placeholder.configure({
				placeholder: ({ node }) =>
					node.type.name === "paragraph" && node.childCount === 0
						? "Start typing..."
						: "",
				showOnlyWhenEditable: true,
				includeChildren: true,
				shouldShow: ({ editor, node }) =>
					editor.isFocused &&
					node.type.name === "paragraph" &&
					node.childCount === 0,
			}),
		],
		content: astToTiptapDoc(ast) as any,
		onCreate: ({ editor }) => {
			currentEditor = editor as Editor;
			onCreate?.({ editor });
		},
		onUpdate: ({ editor }) => {
			onUpdate?.({ editor });
			if (!fileId || !persistState) return;
			// Debounce state writes using the provided debounce ms
			const ms = PERSIST_DEBOUNCE_MS;
			const run = async () => {
				if (persistRunning) {
					// Coalesce multiple rapid updates; run again after the current one finishes
					persistQueued = true;
					return;
				}
				persistRunning = true;
				const ast = tiptapDocToAst(editor.getJSON() as any);
				const children: any[] = Array.isArray((ast as any)?.children)
					? ((ast as any).children as any[])
					: [];
				const order = await ensureTopLevelIds(children);
				try {
					await withWriterKey(
						lix.db,
						writerKey ?? `flashtype_tiptap_editor`,
						async (trx) => {
							await upsertNodes(trx, fileId, children);
							await upsertRootOrder(trx, fileId, order);
							const keepIds = [...order, "root"];
							if (keepIds.length > 0) {
								await trx
									.deleteFrom("state")
									.where("file_id", "=", fileId as any)
									.where("plugin_key", "=", mdPlugin.key)
									.where("entity_id", "not in", keepIds as any)
									.execute();
							} else {
								await trx
									.deleteFrom("state")
									.where("file_id", "=", fileId as any)
									.where("plugin_key", "=", mdPlugin.key)
									.where("entity_id", "<>", "root")
									.execute();
							}
						},
					);
				} finally {
					persistRunning = false;
					if (persistQueued) {
						persistQueued = false;
						// Run again to capture the latest editor state
						await run();
					}
				}
			};
			if (ms <= 0) {
				void run();
			} else {
				if (persistStateTimer) clearTimeout(persistStateTimer);
				persistStateTimer = setTimeout(() => void run(), ms);
			}
		},
		editorProps: {
			handlePaste: async (_view: any, event: ClipboardEvent) => {
				if (!currentEditor) return false;
				return await defaultHandlePaste({
					editor: currentEditor as any,
					event,
				});
			},
			...editorProps,
		},
	});
}

// React useEditor config builder. TipTapEditor should use this to keep a single source.
