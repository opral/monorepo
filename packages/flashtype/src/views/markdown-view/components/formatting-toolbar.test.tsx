import { act, fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, test, beforeEach, afterEach, vi } from "vitest";
import { Editor, type JSONContent } from "@tiptap/core";
import { MarkdownWc } from "@opral/markdown-wc/tiptap";
import { FormattingToolbar } from "./formatting-toolbar";
import { EditorProvider, useEditorCtx } from "../editor/editor-context";
import { buildMarkdownFromEditor } from "../editor/build-markdown-from-editor";

type EditorSetup = {
	editor: Editor;
	element: HTMLElement;
};

function createEditor(content: JSONContent): EditorSetup {
	const element = document.createElement("div");
	document.body.appendChild(element);

	const editor = new Editor({
		element,
		extensions: MarkdownWc() as any,
		content,
	});

	return { editor, element };
}

function destroyEditor({ editor, element }: EditorSetup) {
	editor.destroy();
	element.remove();
}

function InjectEditor({ editor }: { editor: Editor }) {
	const { setEditor } = useEditorCtx();

	useEffect(() => {
		setEditor(editor);
		return () => {
			setEditor(null);
		};
	}, [editor, setEditor]);

	return null;
}

function renderToolbar(editor: Editor) {
	return render(
		<EditorProvider>
			<InjectEditor editor={editor} />
			<FormattingToolbar />
		</EditorProvider>,
	);
}

const paragraphDoc: JSONContent = {
	type: "doc",
	content: [
		{
			type: "paragraph",
			content: [{ type: "text", text: "Hello world" }],
		},
	],
};

const bulletListDoc: JSONContent = {
	type: "doc",
	content: [
		{
			type: "bulletList",
			content: [
				{
					type: "listItem",
					content: [
						{
							type: "paragraph",
							content: [{ type: "text", text: "First" }],
						},
					],
				},
			],
		},
	],
};

describe("FormattingToolbar", () => {
	const originalClipboard = navigator.clipboard;
	let writeTextMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		writeTextMock = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, "clipboard", {
			value: { writeText: writeTextMock },
			configurable: true,
		});
	});

	afterEach(() => {
		Object.defineProperty(navigator, "clipboard", {
			value: originalClipboard,
			configurable: true,
		});
	});

	test("applies bold formatting to the current selection", async () => {
		const setup = createEditor(paragraphDoc);
		const utils = renderToolbar(setup.editor);

		await screen.findByLabelText("Bold");

		await act(async () => {
			setup.editor.commands.setTextSelection({ from: 1, to: 6 });
			fireEvent.click(screen.getByLabelText("Bold"));
		});

		expect(setup.editor.isActive("bold")).toBe(true);

		await act(async () => {
			utils.unmount();
		});
		destroyEditor(setup);
	});

	test("wraps and unwraps the current block in a bullet list", async () => {
		const setup = createEditor(paragraphDoc);
		const utils = renderToolbar(setup.editor);

		const bulletButton = await screen.findByLabelText("Bullet list");

		await act(async () => {
			setup.editor.commands.selectAll();
			fireEvent.click(bulletButton);
		});

		expect(setup.editor.isActive("bulletList")).toBe(true);
		let doc = setup.editor.getJSON() as any;
		expect(doc.content?.[0]?.type).toBe("bulletList");

		await act(async () => {
			setup.editor.commands.setTextSelection({ from: 2, to: 2 });
			fireEvent.click(bulletButton);
		});

		expect(setup.editor.isActive("bulletList")).toBe(false);
		doc = setup.editor.getJSON() as any;
		expect(doc.content?.[0]?.type).toBe("paragraph");

		await act(async () => {
			utils.unmount();
		});
		destroyEditor(setup);
	});

	test("toggles checklist state using the fallback implementation", async () => {
		const setup = createEditor(paragraphDoc);
		const utils = renderToolbar(setup.editor);

		const bulletButton = await screen.findByLabelText("Bullet list");
		const checklistButton = await screen.findByLabelText("Checklist");

		await act(async () => {
			setup.editor.commands.selectAll();
			fireEvent.click(bulletButton);
		});

		await act(async () => {
			setup.editor.commands.setTextSelection({ from: 2, to: 2 });
			fireEvent.click(checklistButton);
		});

		let listItem = (setup.editor.getJSON() as any).content?.[0]?.content?.[0];
		expect(listItem?.attrs?.checked).toBe(false);

		await act(async () => {
			fireEvent.click(checklistButton);
		});

		listItem = (setup.editor.getJSON() as any).content?.[0]?.content?.[0];
		expect(listItem?.attrs?.checked ?? null).toBeNull();

		await act(async () => {
			utils.unmount();
		});
		destroyEditor(setup);
	});

	test("copies the current document as markdown", async () => {
		const setup = createEditor(paragraphDoc);
		const utils = renderToolbar(setup.editor);

		const copyButton = await screen.findByLabelText(/copy markdown/i);
		const expected = buildMarkdownFromEditor(setup.editor);

		await act(async () => {
			fireEvent.click(copyButton);
		});

		expect(writeTextMock).toHaveBeenCalledWith(expected);

		await act(async () => {
			utils.unmount();
		});
		destroyEditor(setup);
	});

	test("reflects external content changes in the toolbar state", async () => {
		const setup = createEditor(bulletListDoc);
		const utils = renderToolbar(setup.editor);

		const bulletButton = await screen.findByLabelText("Bullet list");
		expect(bulletButton).toHaveAttribute("aria-pressed", "true");

		await act(async () => {
			setup.editor.commands.setContent(paragraphDoc);
		});

		expect(bulletButton).toHaveAttribute("aria-pressed", "false");

		await act(async () => {
			utils.unmount();
		});
		destroyEditor(setup);
	});
});
