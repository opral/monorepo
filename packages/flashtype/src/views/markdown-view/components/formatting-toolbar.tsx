import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	type ComponentType,
	type MouseEvent,
	type SVGProps,
} from "react";
import { Toolbar } from "@base-ui-components/react/toolbar";
import { Select } from "@base-ui-components/react/select";
import clsx from "clsx";
import {
	Bold,
	Check,
	CheckSquare,
	ChevronDown,
	Code2,
	Heading1,
	Heading2,
	Heading3,
	Italic,
	List,
	ListOrdered,
	Pilcrow,
	TextQuote,
} from "lucide-react";
import type { Editor } from "@tiptap/core";
import { useEditorCtx } from "../editor/editor-context";
import { buildMarkdownFromEditor } from "../editor/build-markdown-from-editor";

type BlockType =
	| "paragraph"
	| "heading-1"
	| "heading-2"
	| "heading-3"
	| "code"
	| "blockquote";

type FormatState = {
	block: BlockType;
	isBold: boolean;
	isItalic: boolean;
	isCode: boolean;
	isBulletList: boolean;
	isOrderedList: boolean;
	isTaskList: boolean;
};

type BlockOption = {
	value: BlockType;
	label: string;
	description: string;
	icon: ComponentType<{ className?: string }>;
	apply: (editor: Editor) => void;
};

const toolbarButtonClass =
	"inline-flex h-7 min-w-7 select-none items-center justify-center rounded-sm px-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40";

const ToolbarSeparator = () => (
	<Toolbar.Separator className="mx-1 h-4 w-px bg-border" />
);

const BLOCK_OPTIONS: BlockOption[] = [
	{
		value: "paragraph",
		label: "Text",
		description: "Paragraph",
		icon: Pilcrow,
		apply: (editor) => {
			editor.chain().focus().setNode("paragraph").run();
		},
	},
	{
		value: "heading-1",
		label: "Heading 1",
		description: "Large heading",
		icon: Heading1,
		apply: (editor) => {
			editor.chain().focus().setNode("heading", { level: 1 }).run();
		},
	},
	{
		value: "heading-2",
		label: "Heading 2",
		description: "Section heading",
		icon: Heading2,
		apply: (editor) => {
			editor.chain().focus().setNode("heading", { level: 2 }).run();
		},
	},
	{
		value: "heading-3",
		label: "Heading 3",
		description: "Subheading",
		icon: Heading3,
		apply: (editor) => {
			editor.chain().focus().setNode("heading", { level: 3 }).run();
		},
	},
	{
		value: "code",
		label: "Code",
		description: "Code block",
		icon: Code2,
		apply: (editor) => {
			if (editor.isActive("codeBlock")) {
				editor.chain().focus().lift("codeBlock").run();
			} else {
				editor.chain().focus().setNode("codeBlock").run();
			}
		},
	},
	{
		value: "blockquote",
		label: "Quote",
		description: "Quoted text",
		icon: TextQuote,
		apply: (editor) => {
			if (editor.isActive("blockquote")) {
				editor.chain().focus().lift("blockquote").run();
			} else {
				editor.chain().focus().wrapIn("blockquote").run();
			}
		},
	},
];

const initialFormatState: FormatState = {
	block: "paragraph",
	isBold: false,
	isItalic: false,
	isCode: false,
	isBulletList: false,
	isOrderedList: false,
	isTaskList: false,
};

/**
 * Floating toolbar rendering Markdown formatting controls for the TipTap editor.
 *
 * @example
 * <FormattingToolbar className="sticky top-0 z-10" />
 */
export function FormattingToolbar({ className }: { className?: string }) {
	const { editor } = useEditorCtx();
	const [formatState, setFormatState] =
		useState<FormatState>(initialFormatState);
	const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">(
		"idle",
	);

	const suppressMouseDown = useCallback((event: MouseEvent<HTMLElement>) => {
		event.preventDefault();
	}, []);

	const hasTaskListCommand = useMemo(
		() =>
			Boolean(
				editor &&
					typeof (editor.commands as any)?.toggleTaskList === "function",
			),
		[editor],
	);

	useEffect(() => {
		if (!editor) return;
		const update = () => {
			setFormatState({
				block: getActiveBlock(editor),
				isBold: editor.isActive("bold"),
				isItalic: editor.isActive("italic"),
				isCode: editor.isActive("code"),
				isBulletList: editor.isActive("bulletList"),
				isOrderedList: editor.isActive("orderedList"),
				isTaskList: computeTaskListActive(editor, hasTaskListCommand),
			});
		};

		update();

		editor.on("selectionUpdate", update);
		editor.on("transaction", update);
		editor.on("update", update);

		return () => {
			editor.off("selectionUpdate", update);
			editor.off("transaction", update);
			editor.off("update", update);
		};
	}, [editor, hasTaskListCommand]);

	const activeBlockLabel = useMemo(() => {
		const active = BLOCK_OPTIONS.find(
			(option) => option.value === formatState.block,
		);
		return active?.label ?? "Text";
	}, [formatState.block]);

	const handleBlockChange = useCallback(
		(value: BlockType) => {
			if (!editor) return;
			const option = BLOCK_OPTIONS.find((entry) => entry.value === value);
			option?.apply(editor);
		},
		[editor],
	);

	const handleToggleBold = useCallback(() => {
		if (!editor) return;
		editor.chain().focus().toggleMark("bold").run();
	}, [editor]);

	const handleToggleItalic = useCallback(() => {
		if (!editor) return;
		editor.chain().focus().toggleMark("italic").run();
	}, [editor]);

	const handleToggleCode = useCallback(() => {
		if (!editor) return;
		editor.chain().focus().toggleMark("code").run();
	}, [editor]);

	const handleToggleBulletList = useCallback(() => {
		if (!editor) return;
		const chain = editor.chain().focus() as any;
		let success = editor.isActive("bulletList")
			? (chain.liftListItem?.("listItem")?.run?.() ?? false)
			: (chain.wrapIn?.("bulletList")?.run?.() ?? false);
		if (!success) {
			const altChain = editor.chain().focus() as any;
			success =
				chain.toggleList?.("bulletList", "listItem")?.run?.() ??
				altChain.toggleBulletList?.()?.run?.() ??
				false;
		}
	}, [editor]);

	const handleToggleOrderedList = useCallback(() => {
		if (!editor) return;
		const chain = editor.chain().focus() as any;
		let success = editor.isActive("orderedList")
			? (chain.liftListItem?.("listItem")?.run?.() ?? false)
			: (chain.wrapIn?.("orderedList")?.run?.() ?? false);
		if (!success) {
			const altChain = editor.chain().focus() as any;
			success =
				chain.toggleList?.("orderedList", "listItem")?.run?.() ??
				altChain.toggleOrderedList?.()?.run?.() ??
				false;
		}
	}, [editor]);

	const handleToggleTaskList = useCallback(() => {
		if (!editor) return;
		if (typeof editor.chain().focus().toggleTaskList === "function") {
			editor.chain().focus().toggleTaskList().run();
			return;
		}
		toggleTaskListFallback(editor);
	}, [editor]);

	const handleCopyMarkdown = useCallback(() => {
		if (!editor) return;
		if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
			setCopyStatus("error");
			return;
		}
		const markdown = buildMarkdownFromEditor(editor);
		navigator.clipboard
			.writeText(markdown)
			.then(() => setCopyStatus("success"))
			.catch(() => {
				setCopyStatus("error");
			});
	}, [editor]);

	useEffect(() => {
		if (copyStatus === "idle") return;
		const reset = window.setTimeout(() => setCopyStatus("idle"), 2000);
		return () => window.clearTimeout(reset);
	}, [copyStatus]);

	if (!editor) return null;

	return (
		<Toolbar.Root
			className={clsx(
				"flex w-full max-w-5xl items-center gap-1 rounded-md border border-border py-0.5 text-xs text-foreground",
				className,
			)}
			aria-label="Formatting toolbar"
		>
			<Toolbar.Group className="flex flex-1 items-center gap-1">
				<Select.Root
					value={formatState.block}
					onValueChange={handleBlockChange}
				>
					<Toolbar.Button
						render={<Select.Trigger />}
						nativeButton={false}
						className={clsx(
							toolbarButtonClass,
							"min-w-[8.5rem] justify-between gap-2 px-3 text-sm font-medium text-foreground",
						)}
						onMouseDown={suppressMouseDown}
					>
						<Select.Value className="truncate">{activeBlockLabel}</Select.Value>
						<Select.Icon className="text-muted-foreground">
							<ChevronDown className="h-4 w-4" aria-hidden />
						</Select.Icon>
					</Toolbar.Button>
					<Select.Portal>
						<Select.Positioner className="z-50 outline-none" sideOffset={8}>
							<Select.Popup className="min-w-[12rem] rounded-lg border border-border bg-card p-1 shadow-xl">
								<div className="px-2 pb-1 pt-1 text-xs font-medium text-muted-foreground">
									Turn into
								</div>
								{BLOCK_OPTIONS.map((option) => (
									<Select.Item
										key={option.value}
										value={option.value}
										className="group flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none focus-visible:ring-0 data-[highlighted]:bg-muted data-[highlighted]:text-foreground"
									>
										<span className="flex size-5 items-center justify-center text-muted-foreground group-data-[highlighted]:text-foreground">
											<option.icon className="h-4 w-4" aria-hidden />
										</span>
										<div className="flex flex-1 flex-col">
											<span className="text-sm font-medium">
												{option.label}
											</span>
											<span className="text-xs text-muted-foreground group-data-[highlighted]:text-muted-foreground/80">
												{option.description}
											</span>
										</div>
										<Select.ItemIndicator className="text-foreground">
											<Check className="h-4 w-4" aria-hidden />
										</Select.ItemIndicator>
									</Select.Item>
								))}
							</Select.Popup>
						</Select.Positioner>
					</Select.Portal>
				</Select.Root>

				<ToolbarSeparator />

				<Toolbar.Button
					className={clsx(
						toolbarButtonClass,
						"text-muted-foreground hover:bg-muted hover:text-foreground",
						formatState.isBold && "bg-accent/30 text-foreground",
					)}
					onClick={handleToggleBold}
					onMouseDown={suppressMouseDown}
					aria-pressed={formatState.isBold}
					aria-label="Bold"
				>
					<Bold className="h-4 w-4" aria-hidden />
				</Toolbar.Button>

				<Toolbar.Button
					className={clsx(
						toolbarButtonClass,
						"text-muted-foreground hover:bg-muted hover:text-foreground",
						formatState.isItalic && "bg-accent/30 text-foreground",
					)}
					onClick={handleToggleItalic}
					onMouseDown={suppressMouseDown}
					aria-pressed={formatState.isItalic}
					aria-label="Italic"
				>
					<Italic className="h-4 w-4" aria-hidden />
				</Toolbar.Button>

				<Toolbar.Button
					className={clsx(
						toolbarButtonClass,
						"text-muted-foreground hover:bg-muted hover:text-foreground",
						formatState.isCode && "bg-accent/30 text-foreground",
					)}
					onClick={handleToggleCode}
					onMouseDown={suppressMouseDown}
					aria-pressed={formatState.isCode}
					aria-label="Inline code"
				>
					<Code2 className="h-4 w-4" aria-hidden />
				</Toolbar.Button>

				<ToolbarSeparator />

				<Toolbar.Button
					className={clsx(
						toolbarButtonClass,
						"text-muted-foreground hover:bg-muted hover:text-foreground",
						formatState.isOrderedList && "bg-accent/30 text-foreground",
					)}
					onClick={handleToggleOrderedList}
					onMouseDown={suppressMouseDown}
					aria-pressed={formatState.isOrderedList}
					aria-label="Numbered list"
				>
					<ListOrdered className="h-4 w-4" aria-hidden />
				</Toolbar.Button>

				<Toolbar.Button
					className={clsx(
						toolbarButtonClass,
						"text-muted-foreground hover:bg-muted hover:text-foreground",
						formatState.isBulletList && "bg-accent/30 text-foreground",
					)}
					onClick={handleToggleBulletList}
					onMouseDown={suppressMouseDown}
					aria-pressed={formatState.isBulletList}
					aria-label="Bullet list"
				>
					<List className="h-4 w-4" aria-hidden />
				</Toolbar.Button>

				<Toolbar.Button
					className={clsx(
						toolbarButtonClass,
						"text-muted-foreground hover:bg-muted hover:text-foreground",
						formatState.isTaskList && "bg-accent/30 text-foreground",
						!hasTaskListCommand && "opacity-60",
					)}
					onClick={handleToggleTaskList}
					onMouseDown={suppressMouseDown}
					aria-pressed={formatState.isTaskList}
					aria-label="Checklist"
				>
					<CheckSquare className="h-4 w-4" aria-hidden />
				</Toolbar.Button>
			</Toolbar.Group>

			<Toolbar.Button
				className={clsx(
					toolbarButtonClass,
					"ml-auto gap-2 px-3 text-muted-foreground hover:bg-muted hover:text-foreground",
					copyStatus === "success" && "bg-accent/30 text-foreground",
					copyStatus === "error" && "bg-destructive/20 text-destructive",
				)}
				onClick={handleCopyMarkdown}
				aria-label="Copy markdown"
			>
				{copyStatus === "success" ? (
					<>
						<Check className="h-4 w-4" aria-hidden />
						<span className="hidden text-sm font-medium sm:inline">Copied</span>
					</>
				) : (
					<>
						<MarkdownCopyIcon className="h-4 w-4" aria-hidden />
						<span className="hidden text-sm font-medium sm:inline">Copy</span>
					</>
				)}
			</Toolbar.Button>
		</Toolbar.Root>
	);
}

function getActiveBlock(editor: Editor): BlockType {
	if (editor.isActive("heading", { level: 1 })) return "heading-1";
	if (editor.isActive("heading", { level: 2 })) return "heading-2";
	if (editor.isActive("heading", { level: 3 })) return "heading-3";
	if (editor.isActive("codeBlock")) return "code";
	if (editor.isActive("blockquote")) return "blockquote";
	return "paragraph";
}

function computeTaskListActive(editor: Editor, hasTaskListCommand: boolean) {
	if (hasTaskListCommand && editor.isActive("taskList")) return true;
	const listAttrs = editor.getAttributes("bulletList");
	if (listAttrs?.isTaskList) return true;
	const itemAttrs = editor.getAttributes("listItem");
	return typeof itemAttrs?.checked === "boolean";
}

function toggleTaskListFallback(editor: Editor) {
	if (!editor.isActive("bulletList")) {
		const chain = editor.chain().focus() as any;
		const wrapped = chain.wrapIn?.("bulletList")?.run?.();
		if (!wrapped) {
			return;
		}
	}

	const { state, view } = editor;
	const { selection } = state;
	const { from, to } = selection;
	const listItemAttrs = editor.getAttributes("listItem");
	const isCurrentlyTask =
		listItemAttrs && typeof listItemAttrs.checked === "boolean";

	const tr = state.tr;
	let applied = false;

	state.doc.nodesBetween(from, to, (node, pos) => {
		if (node.type.name !== "listItem") return;
		const attrs = { ...node.attrs };
		if (isCurrentlyTask) {
			if (attrs.checked == null) return;
			attrs.checked = null;
		} else {
			if (attrs.checked === false) return;
			attrs.checked = false;
		}
		tr.setNodeMarkup(pos, undefined, attrs);
		applied = true;
	});

	if (applied) {
		view.dispatch(tr);
	}
}

function MarkdownCopyIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			width="1em"
			height="1em"
			viewBox="0 -960 960 960"
			fill="currentColor"
			xmlns="http://www.w3.org/2000/svg"
			{...props}
		>
			<path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm210-360h60v-180h40v120h60v-120h40v180h60v-200q0-17-11.5-28.5T630-680H450q-17 0-28.5 11.5T410-640v200Zm-50 120v-480 480Z" />
		</svg>
	);
}
