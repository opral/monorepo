import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import { useEditorCtx } from "../editor/editor-context";
import {
	slashCommandsPluginKey,
	type SlashCommandState,
} from "../editor/extensions/slash-commands";

type SlashCommand = {
	id: string;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	keywords: string[];
	action: (editor: Editor) => void;
};

const SLASH_COMMANDS: SlashCommand[] = [
	{
		id: "paragraph",
		label: "Text",
		icon: Pilcrow,
		keywords: ["p", "text", "paragraph"],
		action: (editor) => editor.chain().focus().setNode("paragraph").run(),
	},
	{
		id: "heading1",
		label: "Heading 1",
		icon: Heading1,
		keywords: ["h1", "#", "title"],
		action: (editor) =>
			editor.chain().focus().setNode("heading", { level: 1 }).run(),
	},
	{
		id: "heading2",
		label: "Heading 2",
		icon: Heading2,
		keywords: ["h2", "##", "subtitle"],
		action: (editor) =>
			editor.chain().focus().setNode("heading", { level: 2 }).run(),
	},
	{
		id: "heading3",
		label: "Heading 3",
		icon: Heading3,
		keywords: ["h3", "###"],
		action: (editor) =>
			editor.chain().focus().setNode("heading", { level: 3 }).run(),
	},
	{
		id: "bulletList",
		label: "Bullet List",
		icon: List,
		keywords: ["ul", "-", "unordered", "bullets"],
		action: (editor) => {
			const chain = editor.chain().focus() as any;
			if (!chain.wrapIn?.("bulletList")?.run?.()) {
				chain.toggleBulletList?.()?.run?.();
			}
		},
	},
	{
		id: "orderedList",
		label: "Numbered List",
		icon: ListOrdered,
		keywords: ["ol", "1.", "numbered", "ordered"],
		action: (editor) => {
			const chain = editor.chain().focus() as any;
			if (!chain.wrapIn?.("orderedList")?.run?.()) {
				chain.toggleOrderedList?.()?.run?.();
			}
		},
	},
	{
		id: "taskList",
		label: "To-do List",
		icon: CheckSquare,
		keywords: ["todo", "checkbox", "checklist", "task", "[]"],
		action: (editor) => {
			if (typeof editor.chain().focus().toggleTaskList === "function") {
				editor.chain().focus().toggleTaskList().run();
				return;
			}
			// Fallback: create bullet list with checked attribute
			const chain = editor.chain().focus() as any;
			chain.wrapIn?.("bulletList")?.run?.();
		},
	},
	{
		id: "codeBlock",
		label: "Code Block",
		icon: Code2,
		keywords: ["code", "```", "pre", "snippet"],
		action: (editor) => editor.chain().focus().setNode("codeBlock").run(),
	},
	{
		id: "blockquote",
		label: "Quote",
		icon: TextQuote,
		keywords: [">", "quote", "blockquote"],
		action: (editor) => editor.chain().focus().wrapIn("blockquote").run(),
	},
	{
		id: "horizontalRule",
		label: "Divider",
		icon: Minus,
		keywords: ["hr", "---", "divider", "line", "separator"],
		action: (editor) => editor.chain().focus().setHorizontalRule().run(),
	},
	{
		id: "table",
		label: "Table",
		icon: Table,
		keywords: ["table", "grid"],
		action: (editor) => {
			const chain = editor.chain().focus() as any;
			chain.insertTable?.({ rows: 3, cols: 3, withHeaderRow: true })?.run?.();
		},
	},
];

function filterCommands(commands: SlashCommand[], query: string): SlashCommand[] {
	if (!query) return commands;
	const lowerQuery = query.toLowerCase();
	return commands.filter(
		(cmd) =>
			cmd.label.toLowerCase().includes(lowerQuery) ||
			cmd.keywords.some((kw) => kw.toLowerCase().includes(lowerQuery))
	);
}

export function SlashCommandMenu() {
	const { editor } = useEditorCtx();
	const [slashState, setSlashState] = useState<SlashCommandState>({
		active: false,
		query: "",
		range: null,
	});
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [position, setPosition] = useState<{ top: number; left: number } | null>(
		null
	);
	const menuRef = useRef<HTMLDivElement>(null);

	const filteredCommands = useMemo(
		() => filterCommands(SLASH_COMMANDS, slashState.query),
		[slashState.query]
	);

	// Reset selection when filtered list changes
	useEffect(() => {
		setSelectedIndex(0);
	}, [filteredCommands.length, slashState.query]);

	// Listen to slash command state changes
	useEffect(() => {
		if (!editor) return;

		const updateState = () => {
			const state = slashCommandsPluginKey.getState(editor.state);
			if (state) {
				setSlashState(state);
			}
		};

		// Initial state
		updateState();

		editor.on("transaction", updateState);
		return () => {
			editor.off("transaction", updateState);
		};
	}, [editor]);

	// Calculate position when active and update on scroll
	useEffect(() => {
		if (!slashState.active || !slashState.range || !editor) {
			setPosition(null);
			return;
		}

		const updatePosition = () => {
			const { view } = editor;
			const coords = view.coordsAtPos(slashState.range.from);
			const editorRect = view.dom.getBoundingClientRect();

			// Position below the slash character
			setPosition({
				top: coords.bottom + 8,
				left: Math.max(coords.left, editorRect.left),
			});
		};

		updatePosition();

		// Update position on scroll
		window.addEventListener("scroll", updatePosition, true);
		return () => window.removeEventListener("scroll", updatePosition, true);
	}, [slashState.active, slashState.range, editor]);

	const executeCommand = useCallback(
		(command: SlashCommand) => {
			if (!editor) return;

			// Delete the slash and query text
			(editor.commands as any).deleteSlashCommand?.();

			// Execute the command action
			command.action(editor);
		},
		[editor]
	);

	const handleItemClick = useCallback(
		(command: SlashCommand) => {
			executeCommand(command);
		},
		[executeCommand]
	);

	// Handle keyboard navigation
	useEffect(() => {
		if (!slashState.active || !editor) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "ArrowDown") {
				event.preventDefault();
				setSelectedIndex((prev) =>
					prev < filteredCommands.length - 1 ? prev + 1 : 0
				);
				return;
			}

			if (event.key === "ArrowUp") {
				event.preventDefault();
				setSelectedIndex((prev) =>
					prev > 0 ? prev - 1 : filteredCommands.length - 1
				);
				return;
			}

			if (event.key === "Enter") {
				event.preventDefault();
				const command = filteredCommands[selectedIndex];
				if (command) {
					executeCommand(command);
				}
				return;
			}

			if (event.key === "Escape") {
				// Let the extension handle this
				return;
			}
		};

		window.addEventListener("keydown", handleKeyDown, true);
		return () => window.removeEventListener("keydown", handleKeyDown, true);
	}, [slashState.active, editor, filteredCommands, selectedIndex, executeCommand]);

	// Scroll selected item into view
	useEffect(() => {
		if (!menuRef.current) return;
		const selectedEl = menuRef.current.querySelector(
			`[data-index="${selectedIndex}"]`
		);
		if (selectedEl) {
			selectedEl.scrollIntoView({ block: "nearest" });
		}
	}, [selectedIndex]);

	// Close menu when clicking outside
	useEffect(() => {
		if (!slashState.active || !editor) return;

		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				(editor.commands as any).closeSlashMenu?.();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [slashState.active, editor]);

	if (!slashState.active || !position || filteredCommands.length === 0) {
		return null;
	}

	return createPortal(
		<div
			ref={menuRef}
			className="slash-command-menu"
			style={{
				position: "fixed",
				top: position.top,
				left: position.left,
			}}
			role="listbox"
			aria-label="Slash commands"
		>
			{filteredCommands.map((command, index) => (
				<div
					key={command.id}
					data-index={index}
					className="slash-command-item"
					data-selected={index === selectedIndex}
					role="option"
					aria-selected={index === selectedIndex}
					onClick={() => handleItemClick(command)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							handleItemClick(command);
						}
					}}
					onMouseEnter={() => setSelectedIndex(index)}
					tabIndex={0}
				>
					<command.icon className="slash-command-item-icon" aria-hidden />
					<span className="slash-command-item-label">{command.label}</span>
				</div>
			))}
		</div>,
		document.body
	);
}
