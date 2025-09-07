import { test, expect } from "vitest";
import { openLix } from "@lix-js/sdk";
import { plugin as mdPlugin } from "../../../../lix/plugin-md/dist";
import { createEditor } from "./create-editor";
import { handlePaste } from "./handle-paste";
import { AstSchemas } from "@opral/markdown-wc";
import { Editor } from "@tiptap/core";

// TipTap + Lix persistence paste tests (no React)
test("paste at start inserts before existing content (TipTap + Lix)", async () => {
	const lix = await openLix({
		providePlugins: [mdPlugin],
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});
	const fileId = "paste_start_before";

	// Seed initial file content
	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/paste-start.md",
			data: new TextEncoder().encode("Start"),
		})
		.execute();

	// Create editor from fileId (auto-loads initial content)
	const editor: Editor = await createEditor({
		lix,
		fileId,
		persistDebounceMs: 0,
	});

	// Set cursor at start and simulate paste of plain text
	editor.commands.setTextSelection(1);
	await handlePaste({
		editor,
		event: {
			preventDefault: () => {},
			clipboardData: {
				getData: (t: string) => (t === "text/plain" ? "New" : ""),
			},
		},
	});

	const rootOrderAfter = await lix.db
		.selectFrom("state")
		.where("file_id", "=", fileId)
		.where("schema_key", "=", AstSchemas.RootOrderSchema["x-lix-key"])
		.select(["snapshot_content"])
		.execute();

	expect(rootOrderAfter).toHaveLength(1);
	expect(rootOrderAfter[0]?.snapshot_content.order.length).toBe(2);

	const paragraphsAfter = await lix.db
		.selectFrom("state")
		.where("file_id", "=", fileId)
		.where("schema_key", "=", AstSchemas.ParagraphSchema["x-lix-key"])
		.orderBy("entity_id", "asc")
		.select(["snapshot_content"])
		.execute();

	expect(paragraphsAfter).toHaveLength(2);
	expect(paragraphsAfter).toEqual([
		{
			snapshot_content: {
				type: "paragraph",
				children: [{ type: "text", value: "New" }],
				data: expect.any(Object),
			},
		},
		{
			snapshot_content: {
				type: "paragraph",
				children: [{ type: "text", value: "Start" }],
				data: expect.any(Object),
			},
		},
	]);

	const fileAfter = await lix.db
		.selectFrom("file")
		.where("id", "=", fileId)
		.selectAll()
		.executeTakeFirst();

	const mdAfter = new TextDecoder().decode(fileAfter?.data ?? new Uint8Array());

	expect(mdAfter).toBe("New\n\nStart");

	editor.destroy();
});

test("paste at end inserts after existing content (TipTap + Lix)", async () => {
	const lix = await openLix({ providePlugins: [mdPlugin] });
	const fileId = "paste_end_after";

	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/paste-end.md",
			data: new TextEncoder().encode("Start"),
		})
		.execute();

	const editor: Editor = await createEditor({
		lix,
		fileId,
		persistDebounceMs: 0,
	});
	const end = editor.state.doc.content.size;
	editor.commands.setTextSelection(end);
	await handlePaste({
		editor,
		event: {
			preventDefault: () => {},
			clipboardData: {
				getData: (t: string) => (t === "text/plain" ? "New" : ""),
			},
		},
	});
	await new Promise((r) => setTimeout(r, 0));

	const fileAfter = await lix.db
		.selectFrom("file")
		.where("id", "=", fileId)
		.selectAll()
		.executeTakeFirst();
	const mdAfter = new TextDecoder().decode(fileAfter?.data ?? new Uint8Array());
	expect(mdAfter).toBe("Start\n\nNew");
	editor.destroy();
});

test("replace word selection with paste (TipTap + Lix)", async () => {
	const lix = await openLix({ providePlugins: [mdPlugin] });
	const fileId = "paste_replace_word";
	const initial = "Replace THIS TEXT here.";
	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/paste-replace-word.md",
			data: new TextEncoder().encode(initial),
		})
		.execute();

	const editor: Editor = await createEditor({
		lix,
		fileId,
		persistDebounceMs: 0,
	});
	// Select the substring "THIS TEXT" (roughly positions 9..18 in PM coords)
	editor.commands.setTextSelection({ from: 9, to: 18 });
	await handlePaste({
		editor,
		event: {
			preventDefault: () => {},
			clipboardData: {
				getData: (t: string) => (t === "text/plain" ? "new content" : ""),
			},
		},
	});
	await new Promise((r) => setTimeout(r, 0));

	const fileAfter = await lix.db
		.selectFrom("file")
		.where("id", "=", fileId)
		.selectAll()
		.executeTakeFirst();
	const mdAfter = new TextDecoder().decode(fileAfter?.data ?? new Uint8Array());
	expect(mdAfter).toBe("Replace new content here.");
	editor.destroy();
});

test("replace entire document with paste (TipTap + Lix)", async () => {
	const lix = await openLix({ providePlugins: [mdPlugin] });
	const fileId = "paste_replace_all";
	const initial = "Old content\n\nTo be replaced";
	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/paste-replace-all.md",
			data: new TextEncoder().encode(initial),
		})
		.execute();

	const editor: Editor = await createEditor({
		lix,
		fileId,
		persistDebounceMs: 0,
	});
	editor.commands.selectAll();
	await handlePaste({
		editor,
		event: {
			preventDefault: () => {},
			clipboardData: {
				getData: (t: string) =>
					t === "text/plain" ? "# New Document\n\nCompletely new content" : "",
			},
		},
	});
	await new Promise((r) => setTimeout(r, 0));

	const fileAfter = await lix.db
		.selectFrom("file")
		.where("id", "=", fileId)
		.selectAll()
		.executeTakeFirst();
	const mdAfter = new TextDecoder().decode(fileAfter?.data ?? new Uint8Array());
	expect(mdAfter).toBe("# New Document\n\nCompletely new content");
	editor.destroy();
});

test("paste multi-paragraph plain text into empty doc (TipTap + Lix)", async () => {
	const lix = await openLix({ providePlugins: [mdPlugin] });
	const fileId = "paste_plain_multi";
	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/paste-plain-multi.md",
			data: new TextEncoder().encode(""),
		})
		.execute();

	const editor: Editor = await createEditor({
		lix,
		fileId,
		persistDebounceMs: 0,
	});
	await handlePaste({
		editor,
		event: {
			preventDefault: () => {},
			clipboardData: {
				getData: (t: string) =>
					t === "text/plain" ? "First line\n\nSecond line" : "",
			},
		},
	});
	await new Promise((r) => setTimeout(r, 0));
	const fileAfter = await lix.db
		.selectFrom("file")
		.where("id", "=", fileId)
		.selectAll()
		.executeTakeFirst();
	const mdAfter = new TextDecoder().decode(fileAfter?.data ?? new Uint8Array());
	expect(mdAfter).toBe("First line\n\nSecond line");
	editor.destroy();
});

test("Enter splits paragraph → assigns unique ids and root order has no duplicates", async () => {
	const lix = await openLix({ providePlugins: [mdPlugin] });
	const fileId = "enter_split_ids_unique";

	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/enter-split.md",
			data: new TextEncoder().encode("Hello world."),
		})
		.execute();

	const editor: Editor = await createEditor({
		lix,
		fileId,
		persistDebounceMs: 0,
	});

	// Place caret after "Hello"
	const para = editor.state.doc.child(0);
	const paraFrom = 1;
	const idxHello = para.textContent.indexOf("Hello");
	const posSplit = paraFrom + 1 + idxHello + "Hello".length;
	editor.commands.setTextSelection(posSplit);

	// Simulate an Enter key press
	const event = new KeyboardEvent("keydown", {
		key: "Enter",
		bubbles: true,
		cancelable: true,
	});
	editor.view.someProp("handleKeyDown", (f) => f(editor.view, event));

	// Give onUpdate/persist a tick (persistDebounceMs=0 still runs async)
	await new Promise((r) => setTimeout(r, 0));

	const root = await lix.db
		.selectFrom("state")
		.where("file_id", "=", fileId)
		.where("schema_key", "=", AstSchemas.RootOrderSchema["x-lix-key"])
		.select(["snapshot_content"]) // small row
		.executeTakeFirst();

	const order =
		(root?.snapshot_content as { order?: string[] } | undefined)?.order ?? [];
	expect(order.length).toBe(2);
	expect(new Set(order).size).toBe(order.length); // no duplicates

	const paras = await lix.db
		.selectFrom("state")
		.where("file_id", "=", fileId)
		.where("schema_key", "=", AstSchemas.ParagraphSchema["x-lix-key"])
		.select(["entity_id", "snapshot_content"]) // small rows
		.execute();
	expect(paras.length).toBe(2);

	editor.destroy();
});

test("two Enters create three paragraphs with unique ids and correct order", async () => {
	const lix = await openLix({ providePlugins: [mdPlugin] });
	const fileId = "enter_split_three";

	// Seed with a single paragraph
	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/enter-split-three.md",
			data: new TextEncoder().encode("Hello world"),
		})
		.execute();

	const editor: Editor = await createEditor({
		lix,
		fileId,
		persistDebounceMs: 0,
	});

	// Move caret to end and split → new empty paragraph (#2)
	const end = editor.state.doc.content.size;
	editor.commands.setTextSelection(end);
	editor.commands.splitBlock();
	// Type content for paragraph #2
	editor.commands.insertContent("How are you? ");

	// Split again → new paragraph (#3)
	editor.commands.splitBlock();
	editor.commands.insertContent("Good and you? ");

	// Poll until we see 3 paragraphs in state and 3 ids in root order
	let order: string[] = [];
	let paras: { entity_id: string; snapshot_content: unknown }[] = [];
	for (let i = 0; i < 40; i++) {
		const root = await lix.db
			.selectFrom("state")
			.where("file_id", "=", fileId)
			.where("schema_key", "=", AstSchemas.RootOrderSchema["x-lix-key"])
			.select(["snapshot_content"]) // small row
			.executeTakeFirst();
		order = ((root?.snapshot_content as { order?: string[] } | undefined)
			?.order ?? []) as string[];

		paras = (await lix.db
			.selectFrom("state")
			.where("file_id", "=", fileId)
			.where("schema_key", "=", AstSchemas.ParagraphSchema["x-lix-key"])
			.select(["entity_id", "snapshot_content"]) // small rows
			.execute()) as { entity_id: string; snapshot_content: unknown }[];

		if (order.length === 3 && paras.length === 3) break;
		await new Promise((r) => setTimeout(r, 20));
	}

	// Verify root order: 3 unique ids
	expect(order.length).toBe(3);
	expect(new Set(order).size).toBe(3);

	// Verify there are 3 paragraph state rows, unique entity_ids and correct texts
	expect(paras.length).toBe(3);
	const paraIds = paras.map((p) => p.entity_id as string);
	expect(new Set(paraIds).size).toBe(3);
	const texts = paras.map((p) => {
		const sc = p.snapshot_content as
			| { children?: Array<{ value?: string }> }
			| undefined;
		const children = sc?.children ?? [];
		return children
			.map((c) => (typeof c.value === "string" ? c.value : ""))
			.join("")
			.trim();
	});
	// Order in DB may not be textual order; ensure all expected texts are present
	expect(new Set(texts)).toEqual(
		new Set(["Hello world", "How are you?", "Good and you?"]),
	);

	// Root order refers only to existing paragraph ids
	const paraIdSet = new Set(paraIds);
	expect(order.every((id: string) => paraIdSet.has(id))).toBe(true);

	editor.destroy();
});

test("normalize CRLF line endings on paste (TipTap + Lix)", async () => {
	const lix = await openLix({ providePlugins: [mdPlugin] });
	const fileId = "paste_crlf";
	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/paste-crlf.md",
			data: new TextEncoder().encode(""),
		})
		.execute();
	const editor: Editor = await createEditor({
		lix,
		fileId,
		persistDebounceMs: 0,
	});
	await handlePaste({
		editor,
		event: {
			preventDefault: () => {},
			clipboardData: {
				getData: (t: string) =>
					t === "text/plain" ? "Line one\r\n\r\nLine two" : "",
			},
		},
	});
	await new Promise((r) => setTimeout(r, 0));
	const fileAfter = await lix.db
		.selectFrom("file")
		.where("id", "=", fileId)
		.selectAll()
		.executeTakeFirst();
	const mdAfter = new TextDecoder().decode(fileAfter?.data ?? new Uint8Array());
	expect(mdAfter).toBe("Line one\n\nLine two");
	editor.destroy();
});

test("paste complex markdown with lists and code blocks (TipTap + Lix)", async () => {
	const lix = await openLix({ providePlugins: [mdPlugin] });
	const fileId = "paste_complex";
	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/paste-complex.md",
			data: new TextEncoder().encode(""),
		})
		.execute();
	const editor: Editor = await createEditor({
		lix,
		fileId,
		persistDebounceMs: 0,
	});
	const complex = `# Title\n\n- Item 1\n- Item 2\n\n\`\`\`javascript\nconst x = 1;\n\`\`\``;
	await handlePaste({
		editor,
		event: {
			preventDefault: () => {},
			clipboardData: {
				getData: (t: string) => (t === "text/plain" ? complex : ""),
			},
		},
	});
	await new Promise((r) => setTimeout(r, 0));
	const fileAfter = await lix.db
		.selectFrom("file")
		.where("id", "=", fileId)
		.selectAll()
		.executeTakeFirst();
	const mdAfter = new TextDecoder().decode(fileAfter?.data ?? new Uint8Array());
	expect(mdAfter).toContain("# Title");
	expect(mdAfter).toContain("- Item 1");
	expect(mdAfter).toContain("- Item 2");
	expect(mdAfter).toContain("```javascript");
	expect(mdAfter).toContain("const x = 1;");
	editor.destroy();
});

test("paste inline formatting markdown (TipTap + Lix)", async () => {
	const lix = await openLix({ providePlugins: [mdPlugin] });
	const fileId = "paste_inline_format";
	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/paste-inline-format.md",
			data: new TextEncoder().encode(""),
		})
		.execute();
	const editor: Editor = await createEditor({
		lix,
		fileId,
		persistDebounceMs: 0,
	});
	const input = "This has **bold**, _italic_, and `code`.";
	await handlePaste({
		editor,
		event: {
			preventDefault: () => {},
			clipboardData: {
				getData: (t: string) => (t === "text/plain" ? input : ""),
			},
		},
	});
	await new Promise((r) => setTimeout(r, 0));
	const fileAfter = await lix.db
		.selectFrom("file")
		.where("id", "=", fileId)
		.selectAll()
		.executeTakeFirst();
	const mdAfter = new TextDecoder().decode(fileAfter?.data ?? new Uint8Array());
	expect(mdAfter).toBe(input);
	editor.destroy();
});
