import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useEditorCtx } from "../editor/editor-context";
import {
	slashCommandsPluginKey,
	type SlashCommandState,
} from "../editor/extensions/slash-commands";
import { SLASH_BLOCK_COMMANDS, type BlockCommand } from "../editor/block-commands";

function filterCommands(commands: BlockCommand[], query: string): BlockCommand[] {
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
	const [position, setPosition] = useState<{
		top: number;
		left: number;
		placement: "above" | "below";
	} | null>(null);
	const menuRef = useRef<HTMLDivElement>(null);

	const filteredCommands = useMemo(
		() => filterCommands(SLASH_BLOCK_COMMANDS, slashState.query),
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

		// Capture range value for closure
		const range = slashState.range;

		const updatePosition = () => {
			const { view } = editor;
			const coords = view.coordsAtPos(range.from);
			const editorRect = view.dom.getBoundingClientRect();

			// Menu dimensions (max-h-80 = 320px)
			const menuHeight = 320;
			const menuWidth = 180;
			const gap = 8;

			const viewportHeight = window.innerHeight;
			const viewportWidth = window.innerWidth;

			// Check if there's enough space below
			const spaceBelow = viewportHeight - coords.bottom - gap;
			const spaceAbove = coords.top - gap;

			let top: number;
			let placement: "above" | "below";

			if (spaceBelow >= menuHeight || spaceBelow >= spaceAbove) {
				// Position below
				top = coords.bottom + gap;
				placement = "below";
			} else {
				// Position above
				top = coords.top - gap - Math.min(menuHeight, spaceAbove);
				placement = "above";
			}

			// Ensure left doesn't go off-screen
			let left = Math.max(coords.left, editorRect.left);
			if (left + menuWidth > viewportWidth) {
				left = viewportWidth - menuWidth - gap;
			}

			setPosition({ top, left, placement });
		};

		updatePosition();

		// Update position on scroll and resize
		window.addEventListener("scroll", updatePosition, true);
		window.addEventListener("resize", updatePosition);
		return () => {
			window.removeEventListener("scroll", updatePosition, true);
			window.removeEventListener("resize", updatePosition);
		};
	}, [slashState.active, slashState.range, editor]);

	const executeCommand = useCallback(
		(command: BlockCommand) => {
			if (!editor) return;

			// Delete the slash and query text
			(editor.commands as any).deleteSlashCommand?.();

			// Execute the command insert action
			command.insert(editor);
		},
		[editor]
	);

	const handleItemClick = useCallback(
		(command: BlockCommand) => {
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
			className="bg-popover text-popover-foreground border rounded-md shadow-md z-50 p-1 min-w-[180px] max-h-80 overflow-y-auto"
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
					className="flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm cursor-pointer select-none hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
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
					<command.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
					<span>{command.label}</span>
				</div>
			))}
		</div>,
		document.body
	);
}
