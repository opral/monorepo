import React, { Suspense, StrictMode } from "react";
import { expect, test } from "vitest";
import {
	render,
	waitFor,
	screen,
	act,
	fireEvent,
} from "@testing-library/react";
import { LixProvider } from "@lix-js/react-utils";
import {
	openLix,
	type Lix,
	createVersion,
	switchVersion,
	createCheckpoint,
	selectWorkingDiff,
} from "@lix-js/sdk";
import { TipTapEditor } from "./tip-tap-editor";
import { KeyValueProvider } from "@/hooks/key-value/use-key-value";
import { KEY_VALUE_DEFINITIONS } from "@/hooks/key-value/schema";
import { EditorProvider } from "./editor-context";
import { AstSchemas } from "@opral/markdown-wc";
import type { Editor } from "@tiptap/core";
import { plugin as mdPlugin } from "@lix-js/plugin-md";
import { insertMarkdownSchemas } from "../../../lib/insert-markdown-schemas";

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
	await insertMarkdownSchemas({ lix });
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
		.insertInto("key_value_by_version")
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
	const fileId = "file_1";
	const markdown = "# Title\n\nHello";

	const lix = await openLix({
		providePlugins: [mdPlugin],
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: "enabled",
				lixcol_version_id: "global",
			},
			{
				key: "flashtype_active_file_id",
				value: fileId,
				lixcol_version_id: "global",
				lixcol_untracked: true,
			},
		],
	});
	await insertMarkdownSchemas({ lix });

	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/test.md",
			data: new TextEncoder().encode(markdown),
		})
		.execute();

	let editorRef: Editor = undefined as any;

	await act(async () => {
		render(
			<Suspense>
				<Providers lix={lix}>
					<TipTapEditor
						onReady={(editor) => (editorRef = editor)}
						persistDebounceMs={0}
					/>
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
	await insertMarkdownSchemas({ lix });

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
		.insertInto("key_value_by_version")
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
	await waitFor(() => expect(editor).toHaveTextContent("Hello Strict"));
});

test("shows placeholder only while focused on an empty document", async () => {
	const fileId = "file_placeholder_focus";
	const lix = await openLix({
		providePlugins: [mdPlugin],
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: "enabled",
				lixcol_version_id: "global",
			},
			{
				key: "flashtype_active_file_id",
				value: fileId,
				lixcol_version_id: "global",
				lixcol_untracked: true,
			},
		],
	});
	await insertMarkdownSchemas({ lix });

	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/placeholder.md",
			data: new TextEncoder().encode(""),
		})
		.execute();

	let editorRef: Editor | null = null;

	await act(async () => {
		render(
			<Suspense>
				<Providers lix={lix}>
					<TipTapEditor onReady={(editor) => (editorRef = editor)} />
				</Providers>
			</Suspense>,
		);
	});

	const editorNode = await screen.findByTestId("tiptap-editor");

	const container = editorNode.closest(".tiptap-container");
	await waitFor(() => {
		expect(container?.getAttribute("data-editor-focused")).toBe("false");
		const paragraph = editorNode.querySelector("p");
		expect(paragraph).toBeTruthy();
	});

	await act(async () => {
		fireEvent.mouseDown(container as HTMLElement);
		fireEvent.click(container as HTMLElement);
	});

	await waitFor(() => {
		const paragraph = editorNode.querySelector("p");
		expect(paragraph?.getAttribute("data-placeholder")).toBe("Start typing...");
		expect(container?.getAttribute("data-editor-focused")).toBe("true");
	});

	await act(async () => {
		editorRef?.commands.blur();
	});

	await waitFor(() => {
		expect(container?.getAttribute("data-editor-focused")).toBe("false");
	});
});

test("clicking the surface focuses the editor even when content exists", async () => {
	const fileId = "file_focus_surface";
	const lix = await openLix({
		providePlugins: [mdPlugin],
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: "enabled",
				lixcol_version_id: "global",
			},
			{
				key: "flashtype_active_file_id",
				value: fileId,
				lixcol_version_id: "global",
				lixcol_untracked: true,
			},
		],
	});
	await insertMarkdownSchemas({ lix });

	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/has-content.md",
			data: new TextEncoder().encode("Hello world"),
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

	const editorNode = await screen.findByTestId("tiptap-editor");
	const container = editorNode.closest(".tiptap-container");
	await waitFor(() => {
		expect(container?.getAttribute("data-editor-focused")).toBe("false");
	});

	await act(async () => {
		fireEvent.mouseDown(container as HTMLElement);
		fireEvent.click(container as HTMLElement);
	});

	await waitFor(() => {
		expect(container?.getAttribute("data-editor-focused")).toBe("true");
	});
});

test("updates editor when switching to a version with different external state", async () => {
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
	await insertMarkdownSchemas({ lix });

	// Create a file and set it active
	const fileId = "file_switch_version";
	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/switch.md",
			data: new TextEncoder().encode("Hello A"),
		})
		.execute();

	await lix.db
		.insertInto("key_value_by_version")
		.values({
			key: "flashtype_active_file_id",
			value: fileId,
			lixcol_version_id: "global",
			lixcol_untracked: true,
		})
		.execute();

	// Initial render in base version
	await act(async () => {
		render(
			<Suspense>
				<Providers lix={lix}>
					<TipTapEditor />
				</Providers>
			</Suspense>,
		);
	});

	const editorA = await screen.findByTestId("tiptap-editor");
	expect(editorA).toHaveTextContent("Hello A");

	// Create a new version B from current (still showing Hello A in main)
	const vB = await createVersion({ lix });

	// Pre-seed version B's STATE to differ from main (explicit, deterministic)
	const rootKey = AstSchemas.DocumentSchema["x-lix-key"];
	const rootVer = AstSchemas.DocumentSchema["x-lix-version"];
	const paraKey = AstSchemas.schemasByType.paragraph["x-lix-key"];
	const paraVer = AstSchemas.schemasByType.paragraph["x-lix-version"];
	await insertMarkdownSchemas({ lix });
	await lix.db
		.insertInto("state_by_version")
		.values({
			entity_id: "root",
			schema_key: rootKey,
			file_id: fileId,
			version_id: vB.id,
			plugin_key: mdPlugin.key,
			snapshot_content: { order: ["p1"] } as any,
			schema_version: rootVer,
		} as any)
		.execute();
	await lix.db
		.insertInto("state_by_version")
		.values({
			entity_id: "p1",
			schema_key: paraKey,
			file_id: fileId,
			version_id: vB.id,
			plugin_key: mdPlugin.key,
			snapshot_content: {
				type: "paragraph",
				data: { id: "p1" },
				children: [{ type: "text", value: "Hello B" }],
			} as any,
			schema_version: paraVer,
		} as any)
		.execute();

	// Switch to version B — the editor should reflect version B's content "Hello B"
	await act(async () => {
		await switchVersion({ lix, to: vB });
	});

	await waitFor(() => {
		expect(screen.getByTestId("tiptap-editor")).toHaveTextContent("Hello B");
	});
});

test("updates editor when the file's state is changed externally in the same version", async () => {
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
	await insertMarkdownSchemas({ lix });

	const fileId = "file_external_state_update";
	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/external-state.md",
			data: new TextEncoder().encode("Hello A"),
		})
		.execute();

	// Set active file id
	await lix.db
		.insertInto("key_value_by_version")
		.values({
			key: "flashtype_active_file_id",
			value: fileId,
			lixcol_version_id: "global",
			lixcol_untracked: true,
		})
		.execute();

	// Render editor and expect initial state
	await act(async () => {
		render(
			<Suspense>
				<Providers lix={lix}>
					<TipTapEditor />
				</Providers>
			</Suspense>,
		);
	});

	const editorA = await screen.findByTestId("tiptap-editor");
	expect(editorA).toHaveTextContent("Hello A");

	const paragraphSchemaKey = AstSchemas.schemasByType.paragraph["x-lix-key"];

	const paragraph = await lix.db
		.selectFrom("state")
		.where("schema_key", "=", paragraphSchemaKey)
		.where("file_id", "=", fileId)
		.selectAll()
		.executeTakeFirstOrThrow();

	await lix.db
		.updateTable("state")
		.where("schema_key", "=", paragraph.schema_key)
		.where("entity_id", "=", paragraph.entity_id)
		.where("file_id", "=", paragraph.file_id)
		.set({
			snapshot_content: {
				type: "paragraph",
				data: { id: paragraph.entity_id },
				children: [{ type: "text", value: "Hello B" }],
			},
		})
		.execute();

	// Expect editor to reflect external state change (currently fails)
	await waitFor(async () => {
		const editorB = await screen.findByTestId("tiptap-editor");
		expect(editorB).toHaveTextContent("Hello B");
	});
});

test("updates editor when file.data is updated externally (simulate updateFile with markdown)", async () => {
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
	await insertMarkdownSchemas({ lix });

	const fileId = "file_update_blob";
	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/blob.md",
			data: new TextEncoder().encode("Hello A"),
		})
		.execute();

	await lix.db
		.insertInto("key_value_by_version")
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

	const editorA = await screen.findByTestId("tiptap-editor");
	expect(editorA).toHaveTextContent("Hello A");

	// External: write markdown into file.data directly (simulating lix.updateFile)
	await lix.db
		.updateTable("file")
		.set({ data: new TextEncoder().encode("Hello B from file.data") })
		.where("id", "=", fileId)
		.execute();

	// Expect editor to pick up the updated file content (currently fails)
	await waitFor(async () => {
		const editorB = await screen.findByTestId("tiptap-editor");
		expect(editorB).toHaveTextContent("Hello B from file.data");
	});
});

test("preserves main content when switching to a new version and back", async () => {
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

	const fileId = "file_regression_main_preserve";
	// Create file (empty blob; state is our truth)
	await lix.db
		.insertInto("file")
		.values({ id: fileId, path: "/regression.md", data: new Uint8Array() })
		.execute();

	// Activate file globally
	await lix.db
		.insertInto("key_value_by_version")
		.values({
			key: "flashtype_active_file_id",
			value: fileId,
			lixcol_version_id: "global",
			lixcol_untracked: true,
		})
		.execute();

	// Remember currently active version id (main)
	const main = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();
	const mainId = (main as any).version_id as string;

	// Seed state in main to "Hello world"
	const rootKey = AstSchemas.DocumentSchema["x-lix-key"];
	const rootVer = AstSchemas.DocumentSchema["x-lix-version"];
	const paraKey = AstSchemas.schemasByType.paragraph["x-lix-key"];
	const paraVer = AstSchemas.schemasByType.paragraph["x-lix-version"];
	await insertMarkdownSchemas({ lix });
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "root",
			schema_key: rootKey,
			file_id: fileId,
			plugin_key: mdPlugin.key,
			snapshot_content: { order: ["p1"] } as any,
			schema_version: rootVer,
		} as any)
		.execute();
	await lix.db
		.insertInto("state")
		.values({
			entity_id: "p1",
			schema_key: paraKey,
			file_id: fileId,
			plugin_key: mdPlugin.key,
			snapshot_content: {
				type: "paragraph",
				data: { id: "p1" },
				children: [{ type: "text", value: "Hello world" }],
			} as any,
			schema_version: paraVer,
		} as any)
		.execute();

	// Render editor on main
	await act(async () => {
		render(
			<Suspense>
				<Providers lix={lix}>
					<TipTapEditor />
				</Providers>
			</Suspense>,
		);
	});
	const editorA = await screen.findByTestId("tiptap-editor");
	expect(editorA).toHaveTextContent("Hello world");

	// Create a new version from main and switch to it
	const vB = await createVersion({ lix });
	await act(async () => {
		await switchVersion({ lix, to: vB });
	});

	// Switch back to main; the content should still be "Hello world"
	await act(async () => {
		await switchVersion({ lix, to: { id: mainId } as any });
	});

	await waitFor(() => {
		expect(screen.getByTestId("tiptap-editor")).toHaveTextContent(
			"Hello world",
		);
	});
});

test("opening a markdown file without edits should not create a working diff", async () => {
	const fileId = "agents_temp_repro";
	const AGENTS_SEED = `Dear User,

Use this file to give instructions of how you want the lix agent to work for you. You can use any language you'd like (English, German, Spanish, etc). You can find more information on <https://agents.md/>.

For example:

- What's the writing style you prefer?
- Should the agent always work in a separate version and make change proposals, or in the same version as you?
- What are things the agent should always do, never do, or remember?

> @Lix Agent **Check if the user has files other than the /AGENTS.md file then**
>
> 1. If they have no other files:
>
> The user is likely using Flashtype for the first time. Greet the user and prompt them for their favorite city. Then write a 3-5 paragraph blog post about it. Then ask the user in one turn what you should change.
>
> 2. If they have other files:
>
> Greet the user, tell them that they already played around with Flashtype. Thus, they should now modify the AGENTS.md to specify how they want you to collaborate with them.
`;
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
	await insertMarkdownSchemas({ lix });

	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/AGENTS.md",
			data: new TextEncoder().encode(AGENTS_SEED),
		})
		.execute();

	await lix.db
		.insertInto("key_value_by_version")
		.values({
			key: "flashtype_active_file_id",
			value: fileId,
			lixcol_version_id: "global",
			lixcol_untracked: true,
		})
		.execute();

	await createCheckpoint({ lix });

	const diffBefore = await selectWorkingDiff({ lix })
		.select(["diff.entity_id"])
		.where("diff.file_id", "=", fileId)
		.where("diff.status", "!=", "unchanged")
		.execute();
	expect(diffBefore).toEqual([]);
	await act(async () => {
		render(
			<StrictMode>
				<Suspense>
					<Providers lix={lix}>
						<TipTapEditor persistDebounceMs={0} />
					</Providers>
				</Suspense>
			</StrictMode>,
		);
	});

	await screen.findByTestId("tiptap-editor");

	let diffAfter: Array<{ entity_id: string }> = [];
	for (let i = 0; i < 10; i++) {
		diffAfter = await selectWorkingDiff({ lix })
			.select(["diff.entity_id", "diff.status"])
			.where("diff.file_id", "=", fileId)
			.where("diff.status", "!=", "unchanged")
			.execute();
		if (diffAfter.length > 0) break;
		await new Promise((resolve) => setTimeout(resolve, 20));
	}

	expect(diffAfter).toEqual([]);
});
