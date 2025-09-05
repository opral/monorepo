import { ChevronDown, Zap } from "lucide-react";
import { useRef, useState, Suspense } from "react";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DiffIndicator } from "@/components/diff-indicator";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLix, useQueryTakeFirst } from "@lix-js/react-utils";
import { createCheckpoint } from "@lix-js/sdk";
import { selectWorkingDiff } from "@/queries";
import { Diff } from "@/components/diff";
import type { UiDiffComponentProps } from "@lix-js/sdk";

export function ChangeIndicator() {
	const lix = useLix();
	const diff = useQueryTakeFirst(selectWorkingDiff);
	const total = diff?.total ?? 0;
	const added = diff?.added ?? 0;
	const removed = diff?.removed ?? 0;

	const [open, setOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement | null>(null);
	const createBtnRef = useRef<HTMLButtonElement | null>(null);
	const openedViaPointer = useRef(false);

	return (
		<DropdownMenu
			open={open}
			onOpenChange={(v) => {
				setOpen(v);
				if (v) {
					// Focus first action inside when opened
					setTimeout(() => createBtnRef.current?.focus(), 0);
				} else if (!v && openedViaPointer.current) {
					triggerRef.current?.blur();
				}
			}}
		>
			<DropdownMenuTrigger asChild>
				<Button
					ref={triggerRef}
					type="button"
					variant="ghost"
					size="sm"
					className="inline-flex items-center gap-2 cursor-pointer"
					aria-label="Open changes"
					onPointerDown={() => {
						openedViaPointer.current = true;
					}}
					onKeyDown={() => {
						openedViaPointer.current = false;
					}}
				>
					<span className="font-medium text-sm">
						<span data-testid="change-count">{total}</span> changes
					</span>
					<DiffIndicator
						added={added}
						removed={removed}
						highRange={30}
						showCounts={false}
					/>
					<ChevronDown
						className={`size-4 transition-transform duration-200 ${
							open ? "rotate-180" : ""
						}`}
					/>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-[320px] p-0" sideOffset={8} align="end">
				<div className="p-2.5">
					<div className="flex items-center justify-between gap-2">
						<div className="text-sm font-semibold leading-snug">
							Added greeting text
						</div>
						<Tooltip delayDuration={1200}>
							<TooltipTrigger asChild>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="h-7 w-7 p-0"
									aria-label="Auto-fill title and summary"
									onClick={async () => {
										await createCheckpoint({ lix: lix as any });
										setOpen(false);
									}}
								>
									<Zap className="size-4 text-amber-500" />
								</Button>
							</TooltipTrigger>
							<TooltipContent side="bottom">
								Auto-fill title & summary (⌘G)
							</TooltipContent>
						</Tooltip>
					</div>
					<div className="mt-1 text-xs text-muted-foreground">
						Simple greeting text – ready to expand into introduction
					</div>

					{/* Temporary sample diff using plugin_md v2 UI component */}
					<div className="mt-3 rounded-md border bg-secondary/40 p-2 text-xs">
						<Suspense fallback={null}>
							<PanelDiff />
						</Suspense>
					</div>

					<Button
						ref={createBtnRef}
						className="mt-3 w-full"
						size="sm"
						variant="default"
						disabled={total === 0}
						data-testid="create-checkpoint"
					>
						Create checkpoint
					</Button>

					<Button
						variant="link"
						className="mt-2 w-full justify-start h-auto text-xs text-muted-foreground"
					>
						Show all checkpoints →
					</Button>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function PanelDiff() {
	// Minimal example diff until we wire actual working changes
	const diffs: UiDiffComponentProps["diffs"] = [
		{
			plugin_key: "plugin_md",
			schema_key: "markdown_wc_paragraph",
			entity_id: "demo_para",
			snapshot_content_before: {
				type: "paragraph",
				data: { id: "demo_para" },
				children: [{ type: "text", value: "Hello BEFORE, how are you?" }],
			},
			snapshot_content_after: {
				type: "paragraph",
				data: { id: "demo_para" },
				children: [{ type: "text", value: "Hello AFTER, how are you?" }],
			},
		},
	];
	return <Diff diffs={diffs} contentClassName="text-xs" />;
}
