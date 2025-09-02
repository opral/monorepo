import React, { Suspense, StrictMode } from "react";
import { expect, test } from "vitest";
import {
	render,
	waitFor,
	screen,
	waitForElementToBeRemoved,
	act,
} from "@testing-library/react";
import { LixProvider } from "@lix-js/react-utils";
import { openLix, type Lix } from "@lix-js/sdk";
import { plugin as mdPlugin } from "@lix-js/plugin-md-v2";
import { TipTapEditor } from "./tip-tap-editor";
import { KeyValueProvider } from "../../key-value/use-key-value";
import { KEY_VALUE_DEFINITIONS } from "../../key-value/schema";
import { EditorProvider } from "../../editor/editor-context";
import { AstSchemas } from "@opral/markdown-wc";
import type { Editor } from "@tiptap/core";

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
				<EditorProvider>{children}</EditorProvider>
			</KeyValueProvider>
		</LixProvider>
	);
}

// Removed CaptureEditor and editor ref helpers; interact via DOM instead

test("renders initial document content", async () => {
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
	const fileId = "file_render_doc";

	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/render.md",
			data: new TextEncoder().encode("Hello"),
		})
		.execute();

	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "flashtype_active_file_id",
			value: fileId,
			lixcol_version_id: "global",
			lixcol_untracked: true,
		})
		.execute();

	await act(async () => {
		render(
			<Suspense>
				<Providers lix={lix}>
					<TipTapEditor />
				</Providers>
			</Suspense>,
		);
	});

	const editor = await screen.findByTestId("tiptap-editor");
	expect(editor).toHaveTextContent("Hello");
});

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
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "flashtype_active_file_id",
			value: fileId,
			lixcol_version_id: "global",
			lixcol_untracked: true,
		})
		.execute();

	let editorRef: Editor = undefined as any;

	await act(async () => {
		render(
			<Suspense>
				<Providers lix={lix}>
					<TipTapEditor onReady={(editor) => (editorRef = editor)} />
				</Providers>
			</Suspense>,
		);
	});

	const paraSchemaKey = AstSchemas.schemasByType.paragraph["x-lix-key"];

	await waitFor(async () => {
		const end = editorRef.state.doc.content.size;
		editorRef.commands.insertContentAt(end, {
			type: "paragraph",
			content: [{ type: "text", text: "New Paragraph" }],
		});
	});

	const rows = await lix.db
		.selectFrom("state")
		.where("file_id", "=", fileId)
		.where("schema_key", "=", paraSchemaKey)
		.select(["entity_id", "snapshot_content"])
		.execute();

	const hasNewParagraph = rows.some(
		(r: any) =>
			Array.isArray(r.snapshot_content?.children) &&
			(r.snapshot_content.children as any[]).some(
				(c: any) => c.type === "text" && c.value?.includes("New Paragraph"),
			),
	);

	expect(hasNewParagraph).toBe(true); // original + new paragraph
});

test("renders content under React.StrictMode", async () => {
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

	const fileId = "file_strict";
	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/strict.md",
			data: new TextEncoder().encode("Hello Strict"),
		})
		.execute();

	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "flashtype_active_file_id",
			value: fileId,
			lixcol_version_id: "global",
			lixcol_untracked: true,
		})
		.execute();

	await act(async () => {
		render(
			<StrictMode>
				<Suspense>
					<Providers lix={lix}>
						<TipTapEditor />
					</Providers>
				</Suspense>
			</StrictMode>,
		);
	});

	const editor = await screen.findByTestId("tiptap-editor");
	expect(editor).toHaveTextContent("Hello Strict");
});
