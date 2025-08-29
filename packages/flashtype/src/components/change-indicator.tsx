import { ChevronDown, Zap } from "lucide-react";
import { useRef, useState } from "react";
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

export function ChangeIndicator() {
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
					<span className="font-medium text-sm">3 changes</span>
					<DiffIndicator
						added={12}
						removed={3}
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
									onClick={() => {}}
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

					<div className="mt-3 rounded-md border bg-secondary/40 p-2 text-xs">
						Hello{" "}
						<span className="rounded bg-red-100 px-1 text-red-700 line-through">
							world
						</span>{" "}
						<span className="rounded bg-green-100 px-1 text-green-700">
							world
						</span>{" "}
						how are you?
					</div>

					<Button
						ref={createBtnRef}
						className="mt-3 w-full"
						size="sm"
						variant="default"
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
