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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEditorCtx } from "@/editor/editor-context";

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
			<TooltipContent side="bottom">{label}</TooltipContent>
		</Tooltip>
	);
}

export function FormattingToolbar() {
	const { editor } = useEditorCtx();
	return (
		<div className="w-full border-b bg-background">
			<div className="mx-auto flex h-10 items-center justify-center gap-1 px-4">
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
				<Tb label="More">
					<MoreHorizontal />
				</Tb>
			</div>
		</div>
	);
}
