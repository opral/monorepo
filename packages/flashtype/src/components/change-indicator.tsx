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
import { useLix, useQuery, useQueryTakeFirst } from "@lix-js/react-utils";
import { createCheckpoint, selectWorkingDiff, sql } from "@lix-js/sdk";
import { selectWorkingDiffCount } from "@/queries";
import { Diff } from "@/components/diff";
import type { UiDiffComponentProps } from "@lix-js/sdk";
import { plugin } from "@lix-js/plugin-md-v2";

export function ChangeIndicator() {
	const lix = useLix();
	const diffCount = useQueryTakeFirst(selectWorkingDiffCount);
	const total = diffCount?.total ?? 0;
	const added = diffCount?.added ?? 0;
	const removed = diffCount?.removed ?? 0;

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
						<Suspense fallback={<p>Loading...</p>}>{<PanelDiff />}</Suspense>
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
	// Fetch joined working diffs with before/after snapshots using a single query
	const joinedRows = useQuery((lix) => {
		const activeFileIdQ = lix.db
			.selectFrom("key_value")
			.where("key", "=", "flashtype_active_file_id")
			.select("value");

		return (
			selectWorkingDiff({ lix })
				.where("diff.status", "!=", sql.lit("unchanged"))
				.where("diff.file_id", "=", activeFileIdQ)
				.orderBy("diff.entity_id")
				// Join to fetch snapshots and plugin keys
				.innerJoin("change as after", "after.id", "diff.after_change_id")
				.leftJoin("change as before", "before.id", "diff.before_change_id")
				// Limit to Markdown plugin so Diff UI loads
				.where("after.plugin_key", "=", plugin.key)
				.select((eb) => [
					eb.ref("diff.entity_id").as("entity_id"),
					eb.ref("diff.schema_key").as("schema_key"),
					eb.ref("after.plugin_key").as("plugin_key"),
					sql`json(${eb.ref("before.snapshot_content")})`.as(
						"snapshot_content_before",
					),
					sql`json(${eb.ref("after.snapshot_content")})`.as(
						"snapshot_content_after",
					),
				])
		);
	});

	if (!joinedRows || joinedRows.length === 0) return null;

	// Normalize JSON fields if the driver returns them as strings
	const uiDiffs: UiDiffComponentProps["diffs"] = joinedRows.map((r: any) => {
		const before =
			typeof r.snapshot_content_before === "string"
				? safeParseJson(r.snapshot_content_before)
				: (r.snapshot_content_before ?? null);
		const after =
			typeof r.snapshot_content_after === "string"
				? safeParseJson(r.snapshot_content_after)
				: (r.snapshot_content_after ?? null);
		return {
			entity_id: r.entity_id,
			plugin_key: r.plugin_key ?? "unknown_plugin",
			schema_key: r.schema_key,
			snapshot_content_before: before,
			snapshot_content_after: after,
		};
	});

	if (uiDiffs.length === 0) return null;

	return <Diff diffs={uiDiffs} contentClassName="text-xs" />;
}

function safeParseJson(v: string) {
	try {
		return JSON.parse(v);
	} catch {
		return null;
	}
}
