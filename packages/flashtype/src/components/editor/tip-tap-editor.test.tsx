import React from "react";
import { expect, test } from "vitest";
import { render, waitFor, act, fireEvent } from "@testing-library/react";
import { LixProvider } from "@lix-js/react-utils";
import { openLix, type Lix } from "@lix-js/sdk";
import { plugin as mdPlugin } from "@lix-js/plugin-md-v2";
import { TipTapEditor } from "./tip-tap-editor";
import { KeyValueProvider } from "../../key-value/use-key-value";
import { KEY_VALUE_DEFINITIONS } from "../../key-value/schema";
import { EditorProvider, useEditorCtx } from "../../editor/editor-context";
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

async function awaitNextEditorUpdate(editor: any) {
	return new Promise<void>((resolve) => {
		try {
			editor?.once?.("update", () => resolve());
		} catch {
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

	let editorRef: any = null;
	const onReady = (e: any) => {
		editorRef = e;
	};

	await act(async () => {
		render(
			<Providers lix={lix}>
				<TipTapEditor onReady={onReady} />
				<CaptureEditor onReady={onReady} />
			</Providers>,
		);
	});

	await waitFor(() => {
		if (!editorRef) throw new Error("editor not ready");
	});

	const nextUpdate = awaitNextEditorUpdate(editorRef);
	await act(async () => {
		const end = editorRef.state.doc.content.size;
		editorRef.commands.insertContentAt(end, {
			type: "paragraph",
			content: [{ type: "text", text: "New Paragraph" }],
		});
	});
	await nextUpdate;

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
});

test("paste replaces empty doc and persists (e2e)", async () => {
	const lix = await openLix({ providePlugins: [mdPlugin] });
	const fileId = "file_paste_replace";
	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/paste.md",
			data: new TextEncoder().encode(""),
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

	let editorRef: any = null;
	const onReady = (e: any) => {
		editorRef = e;
	};

	let getByTestId: any;
	await act(async () => {
		const res = render(
			<Providers lix={lix}>
				<TipTapEditor onReady={onReady} />
				<CaptureEditor onReady={onReady} />
			</Providers>,
		);
		getByTestId = res.getByTestId;
	});

	await waitFor(() => {
		if (!editorRef) throw new Error("editor not ready");
	});

	// Explicitly place cursor at start to insert before existing content
	editorRef.commands.focus();
	editorRef.commands.setTextSelection(1);

	const el = getByTestId("tiptap-editor").querySelector(
		'[contenteditable="true"]',
	) as HTMLElement;
	fireEvent.paste(el!, {
		clipboardData: {
			getData: (type: string) =>
				type === "text/plain" ? `# Heading\n\nPara` : "",
		},
	} as any);

	// Assert persisted markdown via file read (full e2e)
	await waitFor(async () => {
		const fileAfter = await lix.db
			.selectFrom("file")
			.where("id", "=", fileId)
			.selectAll()
			.executeTakeFirst();
		const mdAfter = new TextDecoder().decode(
			fileAfter?.data ?? new Uint8Array(),
		);
		expect(mdAfter).toBe("# Heading\n\nPara");
	});
});

test("paste inserts fragment into non-empty doc and persists (e2e)", async () => {
	const lix = await openLix({ providePlugins: [mdPlugin] });
	const fileId = "file_paste_insert";
	await lix.db
		.insertInto("file")
		.values({
			id: fileId,
			path: "/paste2.md",
			data: new TextEncoder().encode("Start"),
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

	let editorRef: any = null;
	const onReady = (e: any) => {
		editorRef = e;
	};

	let getByTestId: any;
	await act(async () => {
		const res = render(
			<Providers lix={lix}>
				<TipTapEditor onReady={onReady} />
				<CaptureEditor onReady={onReady} />
			</Providers>,
		);
		getByTestId = res.getByTestId;
	});

	await waitFor(() => {
		if (!editorRef) throw new Error("editor not ready");
	});

	// Explicitly set cursor at start so paste inserts before existing content
	editorRef.commands.focus();
	editorRef.commands.setTextSelection(1);

	const el = getByTestId("tiptap-editor").querySelector(
		'[contenteditable="true"]',
	) as HTMLElement;
	fireEvent.paste(el!, {
		clipboardData: {
			getData: (type: string) => (type === "text/plain" ? "New" : ""),
		},
	} as any);

	// Assert persisted markdown via file read (full e2e)
	await waitFor(async () => {
		const fileAfter = await lix.db
			.selectFrom("file")
			.where("id", "=", fileId)
			.selectAll()
			.executeTakeFirst();

		const mdAfter = new TextDecoder().decode(
			fileAfter?.data ?? new Uint8Array(),
		);
		expect(mdAfter).toBe("New\n\nStart");
	});
});

// Paste handling TODOs (to be implemented e2e with file assertions)
test("paste at end inserts after existing content (e2e)", async () => {
  const lix = await openLix({ providePlugins: [mdPlugin] });
  const fileId = "file_paste_end";

  // Seed a file with initial content
  await lix.db
    .insertInto("file")
    .values({
      id: fileId,
      path: "/paste-end.md",
      data: new TextEncoder().encode("Start"),
    })
    .execute();

  // Set active file
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
  const onReady = (e: any) => {
    editorRef = e;
  };

  let getByTestId: any;
  await act(async () => {
    const res = render(
      <Providers lix={lix}>
        <TipTapEditor onReady={onReady} />
        <CaptureEditor onReady={onReady} />
      </Providers>,
    );
    getByTestId = res.getByTestId;
  });

  await waitFor(() => {
    if (!editorRef) throw new Error("editor not ready");
  });

  // Place cursor at end
  const endPos = editorRef.state.doc.content.size;
  editorRef.commands.focus();
  editorRef.commands.setTextSelection(endPos);

  // Paste "New"
  const el = getByTestId("tiptap-editor").querySelector(
    '[contenteditable="true"]',
  ) as HTMLElement;
  fireEvent.paste(el!, {
    clipboardData: {
      getData: (type: string) => (type === "text/plain" ? "New" : ""),
    },
  } as any);

  // Assert persisted markdown via file read
  await waitFor(async () => {
    const fileAfter = await lix.db
      .selectFrom("file")
      .where("id", "=", fileId)
      .selectAll()
      .executeTakeFirst();
    const mdAfter = new TextDecoder().decode(
      fileAfter?.data ?? new Uint8Array(),
    );
    expect(mdAfter).toBe("Start\n\nNew");
  });
});

test.todo("paste within paragraph inserts at cursor (e2e)");
test.todo("replace word selection with paste (e2e)");
test.todo("replace entire document with paste (e2e)");
test.todo("paste multi-paragraph plain text into empty doc (e2e)");
test.todo("normalize CRLF line endings on paste (e2e)");
test.todo("paste complex markdown with lists and code blocks (e2e)");
test.todo("paste inline formatting markdown (e2e)");
