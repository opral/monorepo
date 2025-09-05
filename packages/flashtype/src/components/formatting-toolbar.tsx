import * as React from "react";
import {
	Bold,
	Italic,
	Strikethrough,
	Code,
	Code2,
	Quote,
	List,
	ListOrdered,
	ListChecks,
	Table as TableIcon,
	Link as LinkIcon,
	Image as ImageIcon,
	MoreHorizontal,
	ChevronDown,
	Copy,
	Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useEditorCtx } from "@/editor/editor-context";
import { Separator } from "@/components/ui/separator";
import { tiptapDocToAst } from "@opral/markdown-wc/tiptap";
import { serializeAst } from "@opral/markdown-wc";

function Tb({
	label,
	onClick,
	children,
}: {
	label: string;
	onClick?: () => void;
	children: React.ReactNode;
}) {
	return (
		<Tooltip delayDuration={1200}>
			<TooltipTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					aria-label={label}
					onMouseDown={(e) => e.preventDefault()}
					onClick={onClick}
				>
					{children}
				</Button>
			</TooltipTrigger>
			<TooltipContent side="top">{label}</TooltipContent>
		</Tooltip>
	);
}

export function FormattingToolbar() {
	const { editor } = useEditorCtx();
	const [copied, setCopied] = React.useState(false);
	const copiedTimerRef = React.useRef<number | null>(null);
	const [copyTooltipOpen, setCopyTooltipOpen] = React.useState(false);
	const [copiedLabelPinned, setCopiedLabelPinned] = React.useState(false);
	const copiedLabelTimerRef = React.useRef<number | null>(null);

	async function handleCopyMarkdown() {
		try {
			if (!editor) return;
			const ast = tiptapDocToAst((editor as any).getJSON());
			const markdown = serializeAst(ast as any);
			await navigator.clipboard.writeText(markdown);
			// success animation
			setCopied(true);
			if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
			// Open tooltip immediately with success label, then close and revert
			setCopyTooltipOpen(true);
			setCopiedLabelPinned(true);
			copiedTimerRef.current = window.setTimeout(() => {
				setCopied(false);
				setCopyTooltipOpen(false);
				// Keep the "Copied" label visible during tooltip exit animation
				if (copiedLabelTimerRef.current)
					window.clearTimeout(copiedLabelTimerRef.current);
				copiedLabelTimerRef.current = window.setTimeout(() => {
					setCopiedLabelPinned(false);
				}, 200);
			}, 1200);
		} catch {
			// Fallback for environments without clipboard API permissions
			try {
				const el = document.createElement("textarea");
				el.value = (editor as any)?.getText?.() ?? "";
				el.setAttribute("readonly", "");
				el.style.position = "absolute";
				el.style.left = "-9999px";
				document.body.appendChild(el);
				el.select();
				document.execCommand("copy");
				document.body.removeChild(el);
				setCopied(true);
				if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
				setCopyTooltipOpen(true);
				setCopiedLabelPinned(true);
				copiedTimerRef.current = window.setTimeout(() => {
					setCopied(false);
					setCopyTooltipOpen(false);
					if (copiedLabelTimerRef.current)
						window.clearTimeout(copiedLabelTimerRef.current);
					copiedLabelTimerRef.current = window.setTimeout(() => {
						setCopiedLabelPinned(false);
					}, 200);
				}, 1200);
			} catch {}
		}
	}

	React.useEffect(() => {
		return () => {
			if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
			if (copiedLabelTimerRef.current)
				window.clearTimeout(copiedLabelTimerRef.current);
		};
	}, []);
	return (
		<div className="w-full border-b bg-background">
			<div className="mx-auto flex h-10 items-center justify-center gap-1 px-4">
				{/* Turn into dropdown (style) */}
				<DropdownTurnInto />
				{/* Divider: style | formatting */}
				<Separator orientation="vertical" className="mx-2 h-5" />
				<Tb
					label="Bold"
					onClick={() => editor?.chain().focus().toggleMark("bold").run()}
				>
					<Bold />
				</Tb>
				<Tb
					label="Italic"
					onClick={() => editor?.chain().focus().toggleMark("italic").run()}
				>
					<Italic />
				</Tb>
				<Tb
					label="Strikethrough"
					onClick={() => editor?.chain().focus().toggleMark("strike").run()}
				>
					<Strikethrough />
				</Tb>
				<Tb
					label="Inline code"
					onClick={() => editor?.chain().focus().toggleMark("code").run()}
				>
					<Code />
				</Tb>
				<Tb
					label="Blockquote"
					onClick={() => {
						// Simple toggle: wrap or lift blockquote
						if (!editor) return;
						const isActive = editor.isActive("blockquote");
						if (isActive) editor.chain().focus().lift("blockquote").run();
						else editor.chain().focus().wrapIn("blockquote").run();
					}}
				>
					<Quote />
				</Tb>
				<Tb
					label="Bullet list"
					onClick={() => {
						// Toggle bullet list by wrapping/lifting
						if (!editor) return;
						const isActive = editor.isActive("bulletList");
						if (isActive) editor.chain().focus().liftListItem("listItem").run();
						else editor.chain().focus().wrapIn("bulletList").run();
					}}
				>
					<List />
				</Tb>
				<Tb
					label="Numbered list"
					onClick={() => {
						if (!editor) return;
						const isActive = editor.isActive("orderedList");
						if (isActive) editor.chain().focus().liftListItem("listItem").run();
						else editor.chain().focus().wrapIn("orderedList").run();
					}}
				>
					<ListOrdered />
				</Tb>
				<Tb label="Checklist">
					<ListChecks />
				</Tb>
				<Tb
					label="Code block"
					onClick={() => {
						if (!editor) return;
						const isActive = editor.isActive("codeBlock");
						if (isActive) editor.chain().focus().lift("codeBlock").run();
						else editor.chain().focus().setNode("codeBlock").run();
					}}
				>
					<Code2 />
				</Tb>
				<Tb label="Insert table">
					<TableIcon />
				</Tb>
				<Tb
					label="Insert link"
					onClick={() => {
						if (!editor) return;
						if (editor.isActive("link")) {
							editor.chain().focus().unsetMark("link").run();
							return;
						}
						const href = window.prompt("Link URL", "https://")?.trim();
						if (!href) return;
						const title =
							window.prompt("Link title (optional)")?.trim() || null;
						editor.chain().focus().setMark("link", { href, title }).run();
					}}
				>
					<LinkIcon />
				</Tb>
				<Tb label="Insert image">
					<ImageIcon />
				</Tb>
				<Separator orientation="vertical" className="mx-2 h-5" />
				<Tooltip
					open={copied || copyTooltipOpen}
					onOpenChange={(v) => {
						// While copied animation is active, pin tooltip open
						if (copied) {
							setCopyTooltipOpen(true);
							return;
						}
						setCopyTooltipOpen(v);
					}}
					delayDuration={1200}
				>
					<TooltipTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							aria-label={copied ? "Copied Markdown" : "Copy Markdown"}
							onMouseDown={(e) => e.preventDefault()}
							onClick={handleCopyMarkdown}
						>
							<span className="relative inline-flex">
								<Copy
									className={`transition-all duration-150 ${copied ? "opacity-0 scale-75" : "opacity-100 scale-100"}`}
								/>
								<Check
									className={`absolute text-emerald-600 transition-all duration-150 ${copied ? "opacity-100 scale-100 animate-in fade-in-0 zoom-in-95" : "opacity-0 scale-75"}`}
									aria-hidden
								/>
							</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent side="top">
						{copied || copiedLabelPinned ? "Copied Markdown" : "Copy Markdown"}
					</TooltipContent>
				</Tooltip>
				<Tb label="More">
					<MoreHorizontal />
				</Tb>
			</div>
		</div>
	);
}

function currentBlockLabel(editor: ReturnType<typeof useEditorCtx>["editor"]) {
	if (!editor) return "Text";
	if (editor.isActive("heading", { level: 1 })) return "Heading 1";
	if (editor.isActive("heading", { level: 2 })) return "Heading 2";
	if (editor.isActive("heading", { level: 3 })) return "Heading 3";
	if (editor.isActive("codeBlock")) return "Code";
	if (editor.isActive("blockquote")) return "Quote";
	return "Text";
}

function DropdownTurnInto() {
	const { editor } = useEditorCtx();
	const [label, setLabel] = React.useState<string>(currentBlockLabel(editor));
	const [open, setOpen] = React.useState(false);
	const [tooltipOpen, setTooltipOpen] = React.useState(false);
	const tooltipSuppressRef = React.useRef(false);

	React.useEffect(() => {
		if (!editor) return;
		const update = () => setLabel(currentBlockLabel(editor));
		editor.on("selectionUpdate", update);
		editor.on("transaction", update);
		update();
		return () => {
			editor.off("selectionUpdate", update);
			editor.off("transaction", update);
		};
	}, [editor]);

	// Suppress tooltip during dropdown open/close transitions
	React.useEffect(() => {
		setTooltipOpen(false);
		tooltipSuppressRef.current = true;
		const t = setTimeout(() => {
			tooltipSuppressRef.current = false;
		}, 250);
		return () => clearTimeout(t);
	}, [open]);

	const isText = !!editor?.isActive("paragraph");
	const isH1 = !!editor?.isActive("heading", { level: 1 });
	const isH2 = !!editor?.isActive("heading", { level: 2 });
	const isH3 = !!editor?.isActive("heading", { level: 3 });
	const isCode = !!editor?.isActive("codeBlock");
	const isQuote = !!editor?.isActive("blockquote");

	return (
		<DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
			<Tooltip
				delayDuration={1200}
				open={!open && tooltipOpen}
				onOpenChange={(v) => {
					if (tooltipSuppressRef.current) {
						setTooltipOpen(false);
						return;
					}
					setTooltipOpen(v);
				}}
			>
				<TooltipTrigger asChild>
					<DropdownMenuTrigger asChild>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="inline-flex items-center gap-1 px-2 w-32 justify-between"
							aria-label="Turn into"
						>
							<span className="text-sm font-medium">{label}</span>
							<ChevronDown
								className={`size-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
								aria-hidden
							/>
						</Button>
					</DropdownMenuTrigger>
				</TooltipTrigger>
				<TooltipContent side="top">Turn into</TooltipContent>
			</Tooltip>
			<DropdownMenuContent
				sideOffset={8}
				align="start"
				className="min-w-[15rem]"
				onCloseAutoFocus={(e) => {
					// Prevent returning focus to the trigger to avoid tooltip-on-close
					e.preventDefault();
				}}
			>
				<DropdownMenuLabel className="text-xs text-muted-foreground">
					Turn into
				</DropdownMenuLabel>
				<DropdownMenuItem
					className="flex items-center gap-3 text-sm"
					onSelect={(e) => {
						e.preventDefault();
						editor?.chain().focus().setNode("paragraph").run();
						setOpen(false);
					}}
				>
					<span className="inline-flex w-5 justify-center text-muted-foreground">
						¶
					</span>
					<span>Text</span>
					<span className={`ml-auto ${isText ? "opacity-100" : "opacity-0"}`}>
						<Check className="size-4" />
					</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					className="flex items-center gap-3 text-sm"
					onSelect={(e) => {
						e.preventDefault();
						editor?.chain().focus().setNode("heading", { level: 1 }).run();
						setOpen(false);
					}}
				>
					<span className="inline-flex w-5 justify-center text-xs text-muted-foreground">
						H1
					</span>
					<span>Heading 1</span>
					<span className={`ml-auto ${isH1 ? "opacity-100" : "opacity-0"}`}>
						<Check className="size-4" />
					</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					className="flex items-center gap-3 text-sm"
					onSelect={(e) => {
						e.preventDefault();
						editor?.chain().focus().setNode("heading", { level: 2 }).run();
						setOpen(false);
					}}
				>
					<span className="inline-flex w-5 justify-center text-xs text-muted-foreground">
						H2
					</span>
					<span>Heading 2</span>
					<span className={`ml-auto ${isH2 ? "opacity-100" : "opacity-0"}`}>
						<Check className="size-4" />
					</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					className="flex items-center gap-3 text-sm"
					onSelect={(e) => {
						e.preventDefault();
						editor?.chain().focus().setNode("heading", { level: 3 }).run();
						setOpen(false);
					}}
				>
					<span className="inline-flex w-5 justify-center text-xs text-muted-foreground">
						H3
					</span>
					<span>Heading 3</span>
					<span className={`ml-auto ${isH3 ? "opacity-100" : "opacity-0"}`}>
						<Check className="size-4" />
					</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					className="flex items-center gap-3 text-sm"
					onSelect={(e) => {
						e.preventDefault();
						const isActive = editor?.isActive("codeBlock");
						if (isActive) editor?.chain().focus().lift("codeBlock").run();
						else editor?.chain().focus().setNode("codeBlock").run();
						setOpen(false);
					}}
				>
					<Code2 className="w-5 size-4 text-muted-foreground" />
					<span>Code</span>
					<span className={`ml-auto ${isCode ? "opacity-100" : "opacity-0"}`}>
						<Check className="size-4" />
					</span>
				</DropdownMenuItem>
				<DropdownMenuItem
					className="flex items-center gap-3 text-sm"
					onSelect={(e) => {
						e.preventDefault();
						const isActive = editor?.isActive("blockquote");
						if (isActive) editor?.chain().focus().lift("blockquote").run();
						else editor?.chain().focus().wrapIn("blockquote").run();
						setOpen(false);
					}}
				>
					<Quote className="w-5 size-4 text-muted-foreground" />
					<span>Quote</span>
					<span className={`ml-auto ${isQuote ? "opacity-100" : "opacity-0"}`}>
						<Check className="size-4" />
					</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
