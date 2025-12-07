import {
	CheckSquare,
	Code2,
	Heading1,
	Heading2,
	Heading3,
	List,
	ListOrdered,
	Minus,
	Pilcrow,
	Table,
	TextQuote,
} from "lucide-react";
import type { Editor } from "@tiptap/core";
import type { ComponentType } from "react";

export type BlockCommand = {
	id: string;
	label: string;
	description: string;
	icon: ComponentType<{ className?: string }>;
	keywords: string[];
	/** Insert action - used by slash commands */
	insert: (editor: Editor) => void;
	/** Toggle action - used by toolbar (converts existing block) */
	toggle?: (editor: Editor) => void;
};

export const BLOCK_COMMANDS: BlockCommand[] = [
	{
		id: "paragraph",
		label: "Text",
		description: "Paragraph",
		icon: Pilcrow,
		keywords: ["p", "text", "paragraph"],
		insert: (editor) => editor.chain().focus().setNode("paragraph").run(),
		toggle: (editor) => editor.chain().focus().setNode("paragraph").run(),
	},
	{
		id: "heading1",
		label: "Heading 1",
		description: "Large heading",
		icon: Heading1,
		keywords: ["h1", "#", "title"],
		insert: (editor) =>
			editor.chain().focus().setNode("heading", { level: 1 }).run(),
		toggle: (editor) =>
			editor.chain().focus().setNode("heading", { level: 1 }).run(),
	},
	{
		id: "heading2",
		label: "Heading 2",
		description: "Section heading",
		icon: Heading2,
		keywords: ["h2", "##", "subtitle"],
		insert: (editor) =>
			editor.chain().focus().setNode("heading", { level: 2 }).run(),
		toggle: (editor) =>
			editor.chain().focus().setNode("heading", { level: 2 }).run(),
	},
	{
		id: "heading3",
		label: "Heading 3",
		description: "Subheading",
		icon: Heading3,
		keywords: ["h3", "###"],
		insert: (editor) =>
			editor.chain().focus().setNode("heading", { level: 3 }).run(),
		toggle: (editor) =>
			editor.chain().focus().setNode("heading", { level: 3 }).run(),
	},
	{
		id: "bulletList",
		label: "Bullet List",
		description: "Unordered list",
		icon: List,
		keywords: ["ul", "-", "unordered", "bullets"],
		insert: (editor) => {
			const chain = editor.chain().focus() as any;
			if (!chain.wrapIn?.("bulletList")?.run?.()) {
				chain.toggleBulletList?.()?.run?.();
			}
		},
	},
	{
		id: "orderedList",
		label: "Numbered List",
		description: "Ordered list",
		icon: ListOrdered,
		keywords: ["ol", "1.", "numbered", "ordered"],
		insert: (editor) => {
			const chain = editor.chain().focus() as any;
			if (!chain.wrapIn?.("orderedList")?.run?.()) {
				chain.toggleOrderedList?.()?.run?.();
			}
		},
	},
	{
		id: "taskList",
		label: "To-do List",
		description: "Checklist",
		icon: CheckSquare,
		keywords: ["todo", "checkbox", "checklist", "task", "[]"],
		insert: (editor) => {
			editor
				.chain()
				.focus()
				.insertContent({
					type: "bulletList",
					attrs: { isTaskList: true },
					content: [
						{
							type: "listItem",
							attrs: { checked: false },
							content: [{ type: "paragraph" }],
						},
					],
				})
				.run();
		},
	},
	{
		id: "codeBlock",
		label: "Code Block",
		description: "Code snippet",
		icon: Code2,
		keywords: ["code", "```", "pre", "snippet"],
		insert: (editor) => editor.chain().focus().setNode("codeBlock").run(),
		toggle: (editor) => {
			if (editor.isActive("codeBlock")) {
				editor.chain().focus().lift("codeBlock").run();
			} else {
				editor.chain().focus().setNode("codeBlock").run();
			}
		},
	},
	{
		id: "blockquote",
		label: "Quote",
		description: "Quoted text",
		icon: TextQuote,
		keywords: [">", "quote", "blockquote"],
		insert: (editor) => editor.chain().focus().wrapIn("blockquote").run(),
		toggle: (editor) => {
			if (editor.isActive("blockquote")) {
				editor.chain().focus().lift("blockquote").run();
			} else {
				editor.chain().focus().wrapIn("blockquote").run();
			}
		},
	},
	{
		id: "horizontalRule",
		label: "Divider",
		description: "Horizontal line",
		icon: Minus,
		keywords: ["hr", "---", "divider", "line", "separator"],
		insert: (editor) => {
			editor.chain().focus().insertContent({ type: "horizontalRule" }).run();
		},
	},
	{
		id: "table",
		label: "Table",
		description: "Table grid",
		icon: Table,
		keywords: ["table", "grid"],
		insert: (editor) => {
			const rows = [];
			for (let r = 0; r < 3; r++) {
				const cells = [];
				for (let c = 0; c < 3; c++) {
					cells.push({ type: "tableCell" });
				}
				rows.push({ type: "tableRow", content: cells });
			}
			editor
				.chain()
				.focus()
				.insertContent({ type: "table", content: rows })
				.run();
		},
	},
];

/** Block commands that can be used in the toolbar (have toggle action) */
export const TOOLBAR_BLOCK_COMMANDS = BLOCK_COMMANDS.filter(
	(cmd) => cmd.toggle,
);

/** All block commands for slash menu */
export const SLASH_BLOCK_COMMANDS = BLOCK_COMMANDS;

/** Block type values used by the toolbar dropdown */
export type ToolbarBlockType =
	| "paragraph"
	| "heading-1"
	| "heading-2"
	| "heading-3"
	| "code"
	| "blockquote";

/** Block option format for toolbar dropdown */
export type ToolbarBlockOption = {
	value: ToolbarBlockType;
	label: string;
	description: string;
	icon: ComponentType<{ className?: string }>;
	apply: (editor: Editor) => void;
};

/** Map internal IDs to toolbar dropdown values */
const idToToolbarValue: Record<string, ToolbarBlockType> = {
	paragraph: "paragraph",
	heading1: "heading-1",
	heading2: "heading-2",
	heading3: "heading-3",
	codeBlock: "code",
	blockquote: "blockquote",
};

/** Toolbar-specific label overrides (where different from slash menu) */
const toolbarLabelOverrides: Record<
	string,
	{ label: string; description: string }
> = {
	codeBlock: { label: "Code", description: "Code block" },
};

/** Block options formatted for toolbar dropdown */
export const TOOLBAR_BLOCK_OPTIONS: ToolbarBlockOption[] =
	TOOLBAR_BLOCK_COMMANDS.filter((cmd) => idToToolbarValue[cmd.id]).map(
		(cmd) => ({
			value: idToToolbarValue[cmd.id]!,
			label: toolbarLabelOverrides[cmd.id]?.label ?? cmd.label,
			description:
				toolbarLabelOverrides[cmd.id]?.description ?? cmd.description,
			icon: cmd.icon,
			apply: cmd.toggle!,
		}),
	);
