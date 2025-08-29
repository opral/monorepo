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

function Tb({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<Tooltip delayDuration={1200}>
			<TooltipTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					aria-label={label}
					onClick={() => {}}
				>
					{children}
				</Button>
			</TooltipTrigger>
			<TooltipContent side="bottom">{label}</TooltipContent>
		</Tooltip>
	);
}

export function FormattingToolbar() {
	return (
		<div className="w-full border-b bg-background">
			<div className="mx-auto flex h-10 items-center justify-center gap-1 px-4">
				<Tb label="Bold">
					<Bold />
				</Tb>
				<Tb label="Italic">
					<Italic />
				</Tb>
				<Tb label="Strikethrough">
					<Strikethrough />
				</Tb>
				<Tb label="Inline code">
					<Code />
				</Tb>
				<Tb label="Blockquote">
					<Quote />
				</Tb>
				<Tb label="Bullet list">
					<List />
				</Tb>
				<Tb label="Numbered list">
					<ListOrdered />
				</Tb>
				<Tb label="Checklist">
					<ListChecks />
				</Tb>
				<Tb label="Code block">
					<Code2 />
				</Tb>
				<Tb label="Insert table">
					<TableIcon />
				</Tb>
				<Tb label="Insert link">
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
