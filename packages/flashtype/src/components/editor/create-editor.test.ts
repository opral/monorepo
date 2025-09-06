import { test, expect } from "vitest";
import { openLix } from "@lix-js/sdk";
import { plugin as mdPlugin } from "@lix-js/plugin-md";
import { createEditor } from "./create-editor";
import { handlePaste } from "./handle-paste";
import { AstSchemas } from "@opral/markdown-wc";

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
	const editor = await createEditor({ lix, fileId, persistDebounceMs: 0 });

	// Set cursor at start and simulate paste of plain text
	editor.commands.setTextSelection(1);
	await handlePaste({
		editor: editor as any,
		event: {
			preventDefault: () => {},
			clipboardData: {
				getData: (t: string) => (t === "text/plain" ? "New" : ""),
			},
		} as any,
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

	const editor = await createEditor({ lix, fileId, persistDebounceMs: 0 });
	const end = (editor as any).state.doc.content.size;
	editor.commands.setTextSelection(end);
	await handlePaste({
		editor: editor as any,
		event: {
			preventDefault: () => {},
			clipboardData: {
				getData: (t: string) => (t === "text/plain" ? "New" : ""),
			},
		} as any,
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

	const editor = await createEditor({ lix, fileId, persistDebounceMs: 0 });
	// Select the substring "THIS TEXT" (roughly positions 9..18 in PM coords)
	editor.commands.setTextSelection({ from: 9, to: 18 });
	await handlePaste({
		editor: editor as any,
		event: {
			preventDefault: () => {},
			clipboardData: {
				getData: (t: string) => (t === "text/plain" ? "new content" : ""),
			},
		} as any,
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

	const editor = await createEditor({ lix, fileId, persistDebounceMs: 0 });
	editor.commands.selectAll();
	await handlePaste({
		editor: editor as any,
		event: {
			preventDefault: () => {},
			clipboardData: {
				getData: (t: string) =>
					t === "text/plain" ? "# New Document\n\nCompletely new content" : "",
			},
		} as any,
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

	const editor = await createEditor({ lix, fileId, persistDebounceMs: 0 });
	await handlePaste({
		editor: editor as any,
		event: {
			preventDefault: () => {},
			clipboardData: {
				getData: (t: string) =>
					t === "text/plain" ? "First line\n\nSecond line" : "",
			},
		} as any,
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
	const editor = await createEditor({ lix, fileId, persistDebounceMs: 0 });
	await handlePaste({
		editor: editor as any,
		event: {
			preventDefault: () => {},
			clipboardData: {
				getData: (t: string) =>
					t === "text/plain" ? "Line one\r\n\r\nLine two" : "",
			},
		} as any,
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
	const editor = await createEditor({ lix, fileId, persistDebounceMs: 0 });
	const complex = `# Title\n\n- Item 1\n- Item 2\n\n\`\`\`javascript\nconst x = 1;\n\`\`\``;
	await handlePaste({
		editor: editor as any,
		event: {
			preventDefault: () => {},
			clipboardData: {
				getData: (t: string) => (t === "text/plain" ? complex : ""),
			},
		} as any,
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
	const editor = await createEditor({ lix, fileId, persistDebounceMs: 0 });
	const input = "This has **bold**, _italic_, and `code`.";
	await handlePaste({
		editor: editor as any,
		event: {
			preventDefault: () => {},
			clipboardData: {
				getData: (t: string) => (t === "text/plain" ? input : ""),
			},
		} as any,
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
