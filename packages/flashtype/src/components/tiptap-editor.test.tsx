import React from "react";
import { expect, test } from "vitest";
import { render, waitFor, act } from "@testing-library/react";
import { LixProvider } from "@lix-js/react-utils";
import { openLix, type Lix } from "@lix-js/sdk";
import { plugin as mdPlugin } from "@lix-js/plugin-md-v2";
import { TipTapEditor } from "./tiptap-editor";
import { KeyValueProvider } from "../key-value/use-key-value";
import { KEY_VALUE_DEFINITIONS } from "../key-value/schema";
import { EditorProvider, useEditorCtx } from "../editor/editor-context";
import { AstSchemas } from "@opral/markdown-wc";

function Providers({
	lix,
	defs,
	children,
}: {
	lix: Lix;
	defs?: any;
	children: React.ReactNode;
}) {
	return (
		<LixProvider lix={lix}>
			<KeyValueProvider defs={defs ?? KEY_VALUE_DEFINITIONS}>
				<EditorProvider>
					<React.Suspense fallback={null}>{children}</React.Suspense>
				</EditorProvider>
			</KeyValueProvider>
		</LixProvider>
	);
}

function CaptureEditor({ onReady }: { onReady: (editor: any) => void }) {
	const { editor } = useEditorCtx();
	React.useEffect(() => {
		if (editor) onReady(editor);
	}, [editor, onReady]);
	return null;
}

// Helper: await the next editor 'update' event once
async function awaitNextEditorUpdate(editor: any) {
	return new Promise<void>((resolve) => {
		try {
			editor?.once?.("update", () => resolve());
		} catch {
			// Fallback: resolve on next tick if event emitter is unavailable
			setTimeout(() => resolve(), 0);
		}
	});
}

test("persists state changes on edit (paragraph append)", async () => {
	const lix = await openLix({
		providePlugins: [mdPlugin],
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: "enabled",
				lixcol_version_id: "global",
			},
		],
	});

	// 1) Seed a markdown file
	const fileId = "file_1";
	const markdown = "# Title\n\nHello";

	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/test.md",
			data: new TextEncoder().encode(markdown),
		})
		.execute();

	// 2) Seed active file id (global, untracked) so useKeyValue resolves immediately
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "flashtype_active_file_id",
			value: fileId,
			lixcol_version_id: "global",
			lixcol_untracked: true,
		})
		.execute();

	// 3) Render editor and capture the tiptap instance
	let editorRef: any = null;
	const onReady = (e: any) => {
		editorRef = e;
	};

	await act(async () => {
		render(
			<Providers lix={lix}>
				<TipTapEditor
					onReady={(e) => {
						editorRef = e;
					}}
				/>
				<CaptureEditor onReady={onReady} />
			</Providers>,
		);
	});

	// 4) Wait for editor instance (onReady)
	await waitFor(() => {
		if (!editorRef) throw new Error("editor not ready");
	});

	// 5) Perform an edit – append a new paragraph at the end
	// Subscribe to the next editor update triggered by the edit
	const nextUpdate = awaitNextEditorUpdate(editorRef);
	await act(async () => {
		const end = editorRef.state.doc.content.size;
		editorRef.commands.insertContentAt(end, {
			type: "paragraph",
			content: [{ type: "text", text: "New Paragraph" }],
		});
	});
	// Await the update emitted by the edit above
	await nextUpdate;

	// 6) Wait for debounce and state write (poll until a paragraph row appears)
	const paraKey = AstSchemas.schemasByType.paragraph["x-lix-key"];
	await waitFor(async () => {
		const rows = await lix.db
			.selectFrom("state")
			.where("file_id", "=", fileId)
			.where("schema_key", "=", paraKey)
			.select(["entity_id", "snapshot_content"])
			.execute();
		const hasNewParagraph = rows.some(
			(r: any) =>
				Array.isArray(r.snapshot_content?.children) &&
				(r.snapshot_content.children as any[]).some(
					(c: any) => c.type === "text" && c.value?.includes("New Paragraph"),
				),
		);
		if (!hasNewParagraph) throw new Error("new paragraph not persisted yet");
	});

	// 7) Verify node snapshots were written to state
	const rows = await lix.db
		.selectFrom("state")
		.where("file_id", "=", fileId)
		.where("schema_key", "=", paraKey)
		.select(["entity_id", "snapshot_content"])
		.execute();

	expect(rows.length).toBeGreaterThan(0);
	// Ensure snapshot includes data.id and text content
	const hasId = rows.some((r) => r.snapshot_content?.data?.id);
	const hasText = rows.some(
		(r) =>
			Array.isArray(r.snapshot_content?.children) &&
			(r.snapshot_content.children as any[]).some(
				(c) => c.type === "text" && c.value?.includes("New Paragraph"),
			),
	);
	expect(hasId).toBe(true);
	expect(hasText).toBe(true);

	// 8) Verify root order written/updated
	const rootKey = (AstSchemas.RootOrderSchema as any)["x-lix-key"] as string;
	const root = await lix.db
		.selectFrom("state")
		.where("file_id", "=", fileId as any)
		.where("schema_key", "=", rootKey)
		.select(["snapshot_content"])
		.executeTakeFirst();

	expect(Array.isArray((root?.snapshot_content as any)?.order)).toBe(true);
});

test("debounces rapid updates and persists once", async () => {
	const lix = await openLix({
		providePlugins: [mdPlugin],
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: "enabled",
				lixcol_version_id: "global",
			},
		],
	});

	// Seed file
	const fileId = "file_2";
	const markdown = "Hello";

	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/debounce.md",
			data: new TextEncoder().encode(markdown),
		})
		.execute();

	const stateAfterInsert = await lix.db
		.selectFrom("state")
		.where("file_id", "=", fileId)
		.where("plugin_key", "=", mdPlugin.key)
		.select(["snapshot_content", "entity_id", "schema_key", "plugin_key"])
		.execute();

	expect(stateAfterInsert).toEqual(
		expect.arrayContaining([
			{
				entity_id: expect.any(String),
				schema_key: AstSchemas.ParagraphSchema["x-lix-key"],
				plugin_key: mdPlugin.key,
				snapshot_content: expect.objectContaining({
					type: "paragraph",
					data: { id: expect.any(String) },
					children: [
						expect.objectContaining({
							type: "text",
							value: "Hello",
						}),
					],
				}),
			},
			{
				entity_id: "root",
				schema_key: AstSchemas.RootOrderSchema["x-lix-key"],
				plugin_key: mdPlugin.key,
				snapshot_content: expect.objectContaining({
					order: expect.arrayContaining([expect.any(String)]),
				}),
			},
		]),
	);

	// Activate file id
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "flashtype_active_file_id",
			value: fileId,
			lixcol_version_id: "global",
			lixcol_untracked: true,
		})
		.execute();

	let editorRef: any = null;
	const onReady = (e: any) => (editorRef = e);

	await act(async () => {
		render(
			<Providers lix={lix}>
				<TipTapEditor onReady={onReady} persistDebounceMs={120} />
				<CaptureEditor onReady={onReady} />
			</Providers>,
		);
	});

	await waitFor(() => {
		if (!editorRef) throw new Error("editor not ready");
	});

	// Perform multiple rapid edits (simulate typing bursts)
	// Subscribe to next update from the burst of edits
	const nextBurstUpdate = awaitNextEditorUpdate(editorRef);
	await act(async () => {
		const end = editorRef.state.doc.content.size;
		editorRef.commands.insertContentAt(end, {
			type: "paragraph",
			content: [{ type: "text", text: "One" }],
		});
		editorRef.commands.insertContentAt(editorRef.state.doc.content.size, {
			type: "paragraph",
			content: [{ type: "text", text: "Two" }],
		});
		editorRef.commands.insertContentAt(editorRef.state.doc.content.size, {
			type: "paragraph",
			content: [{ type: "text", text: "Three" }],
		});
	});
	// Await an update emitted by the burst (at least one will fire)
	await nextBurstUpdate;

	// Wait for a single debounced persist to run by checking state
	await waitFor(async () => {
		const paraKey = AstSchemas.schemasByType.paragraph["x-lix-key"];
		const rows = await lix.db
			.selectFrom("state")
			.where("file_id", "=", fileId)
			.where("schema_key", "=", paraKey)
			.select(["entity_id", "snapshot_content"])
			.execute();
		const hasThree = rows.some(
			(r: any) =>
				Array.isArray(r.snapshot_content?.children) &&
				(r.snapshot_content.children as any[]).some(
					(c: any) => c.type === "text" && c.value === "Three",
				),
		);
		if (!hasThree) throw new Error("final debounced change not persisted yet");
	});

	// Ensure debounced persist produced final state; count verification is inferred via history below

	// Verify final state reflects only the last change content
	const paraKey = AstSchemas.schemasByType.paragraph["x-lix-key"];
	const rows = await lix.db
		.selectFrom("state")
		.where("file_id", "=", fileId)
		.where("schema_key", "=", paraKey)
		.select(["entity_id", "snapshot_content"])
		.execute();

	// we expect only one paragraph (ignore extra fields like position)
	expect(rows).toEqual([
		expect.objectContaining({
			entity_id: expect.any(String),
			snapshot_content: expect.objectContaining({
				type: "paragraph",
				data: expect.objectContaining({ id: expect.any(String) }),
				children: expect.arrayContaining([
					expect.objectContaining({
						type: "text",
						value: "Three",
					}),
				]),
			}),
		}),
	]);

	const history = await lix.db
		.selectFrom("state_history")
		.selectAll()
		.where("file_id", "=", fileId)
		.where(
			"root_commit_id",
			"=",
			lix.db
				.selectFrom("active_version")
				.innerJoin("version", "version.id", "active_version.version_id")
				.select(["version.commit_id"])
				.limit(1),
		)
		.where("schema_key", "=", paraKey)
		.orderBy("depth", "asc")
		.execute();

	expect(history).toEqual([
		expect.objectContaining({
			file_id: fileId,
			schema_key: paraKey,
			depth: 0,
			snapshot_content: expect.objectContaining({
				type: "paragraph",
				data: expect.objectContaining({ id: expect.any(String) }),
				children: expect.arrayContaining([
					expect.objectContaining({ type: "text", value: "Three" }),
				]),
			}),
		}),
		expect.objectContaining({
			file_id: fileId,
			schema_key: paraKey,
			depth: 1,
			snapshot_content: expect.objectContaining({
				type: "paragraph",
				data: expect.objectContaining({ id: expect.any(String) }),
				children: expect.arrayContaining([
					expect.objectContaining({ type: "text", value: "Hello" }),
				]),
			}),
		}),
	]);
});

test("preserves stable IDs for unchanged blocks across writes", async () => {
	const lix = await openLix({
		providePlugins: [mdPlugin],
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: "enabled",
				lixcol_version_id: "global",
			},
		],
	});

	// Seed file
	const fileId = "file_3";
	const markdown = "# Title\n\nHello";
	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/stable-ids.md",
			data: new TextEncoder().encode(markdown),
		})
		.execute();

	// Activate file id
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "flashtype_active_file_id",
			value: fileId,
			lixcol_version_id: "global",
			lixcol_untracked: true,
		})
		.execute();

	let editorRef: any = null;
	const onReady = (e: any) => (editorRef = e);

	await act(async () => {
		render(
			<Providers lix={lix}>
				<TipTapEditor onReady={onReady} persistDebounceMs={80} />
				<CaptureEditor onReady={onReady} />
			</Providers>,
		);
	});

	await waitFor(() => {
		if (!editorRef) throw new Error("editor not ready");
	});

	// First edit: append a paragraph (this also persists heading + first paragraph with assigned ids)
	await act(async () => {
		const end = editorRef.state.doc.content.size;
		editorRef.commands.insertContentAt(end, {
			type: "paragraph",
			content: [{ type: "text", text: "Block A" }],
		});
	});

	// Wait until a paragraph containing "Block A" exists to confirm first persist
	await waitFor(async () => {
		const paraKey = AstSchemas.schemasByType.paragraph["x-lix-key"];
		const rows = await lix.db
			.selectFrom("state")
			.where("file_id", "=", fileId)
			.where("schema_key", "=", paraKey)
			.select(["snapshot_content"])
			.execute();
		const hasBlockA = rows.some(
			(r: any) =>
				Array.isArray(r.snapshot_content?.children) &&
				(r.snapshot_content.children as any[]).some(
					(c: any) => c.type === "text" && c.value === "Block A",
				),
		);
		if (!hasBlockA) throw new Error("first persist not done");
	});

	// Capture heading entity id after first persist
	const headingKey = AstSchemas.schemasByType.heading["x-lix-key"];
	const hRows1 = (await lix.db
		.selectFrom("state")
		.where("file_id", "=", fileId)
		.where("schema_key", "=", headingKey)
		.select(["entity_id", "snapshot_content"])
		.execute()) as any[];
	expect(hRows1.length).toBe(1);
	const headingId1 = hRows1[0].entity_id;

	// Second edit: append another paragraph
	await act(async () => {
		const end = editorRef.state.doc.content.size;
		editorRef.commands.insertContentAt(end, {
			type: "paragraph",
			content: [{ type: "text", text: "Block B" }],
		});
	});

	// Wait until a paragraph containing "Block B" exists to confirm second persist
	await waitFor(async () => {
		const paraKey = AstSchemas.schemasByType.paragraph["x-lix-key"];
		const rows = await lix.db
			.selectFrom("state")
			.where("file_id", "=", fileId)
			.where("schema_key", "=", paraKey)
			.select(["snapshot_content"])
			.execute();
		const hasBlockB = rows.some(
			(r: any) =>
				Array.isArray(r.snapshot_content?.children) &&
				(r.snapshot_content.children as any[]).some(
					(c: any) => c.type === "text" && c.value === "Block B",
				),
		);
		if (!hasBlockB) throw new Error("second persist not done");
	});

	// Heading row should still be exactly one entry with the same entity_id
	const hRows2 = (await lix.db
		.selectFrom("state")
		.where("file_id", "=", fileId)
		.where("schema_key", "=", headingKey)
		.select(["entity_id", "snapshot_content"])
		.execute()) as any[];
	expect(hRows2.length).toBe(1);
	expect(hRows2[0].entity_id).toBe(headingId1);
});
