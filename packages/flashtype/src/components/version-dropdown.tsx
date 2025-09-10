import { Check, ChevronDown, Plus, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useLix, useQuery, useQueryTakeFirst } from "@lix-js/react-utils";
import { createVersion, switchVersion, type LixVersion } from "@lix-js/sdk";

export function VersionDropdown() {
	const lix = useLix();
	const [open, setOpen] = useState(false);
	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

	// Active version with name/id for the button label
	const activeVersion = useQueryTakeFirst(({ lix }) =>
		lix.db
			.selectFrom("active_version")
			.innerJoin("version", "active_version.version_id", "version.id")
			.selectAll("version"),
	);

	// Non-hidden versions for the list
	const versions = useQuery(({ lix }) =>
		lix.db.selectFrom("version").where("hidden", "=", false).selectAll(),
	);

	const sorted = useMemo(() => {
		const arr = versions ?? [];
		// Put active first, then by name
		return arr.slice().sort((a, b) => {
			if (activeVersion) {
				if (a.id === activeVersion.id) return -1;
				if (b.id === activeVersion.id) return 1;
			}
			return (a.name || "").localeCompare(b.name || "");
		});
	}, [versions, activeVersion]);

	const onSelect = useCallback(
		async (v: Pick<LixVersion, "id">) => {
			await switchVersion({ lix, to: v });
			setOpen(false);
		},
		[lix],
	);

	const onCreate = useCallback(async () => {
		if (!activeVersion) return;
		const nv = await createVersion({ lix, from: activeVersion });
		await switchVersion({ lix, to: nv });
		setOpen(false);
	}, [lix, activeVersion]);

	const label = activeVersion?.name ?? "";

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="ghost"
					aria-expanded={open}
					size="sm"
					className="gap-1 px-2"
				>
					<span className="truncate max-w-[160px]" title={label}>
						{label || "Select version"}
					</span>
					<ChevronDown
						className={cn(
							"size-4 opacity-50 transition-transform",
							open ? "rotate-180" : "",
						)}
					/>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[260px] p-0" align="start">
				<Command>
					<CommandInput placeholder="Filter versions…" className="h-9" />
					<CommandList>
						<CommandEmpty>No versions found.</CommandEmpty>
						<CommandGroup heading="Versions">
							{sorted.map((v) => {
								const isActive = activeVersion?.id === v.id;
								const isConfirming = confirmDeleteId === v.id;
								return (
									<CommandItem
										key={v.id}
										value={v.name}
										onSelect={() => {
											if (isConfirming) return;
											void onSelect({ id: v.id });
										}}
										title={v.id}
										className="group flex items-center cursor-pointer"
									>
										<div className="flex w-full items-center gap-2 cursor-pointer">
											<div className="truncate" style={{ maxWidth: 150 }}>
												{v.name}
											</div>
											<div className="ml-auto flex items-center gap-2">
												{isActive ? (
													<Check className="size-4 opacity-100" />
												) : isConfirming ? (
													<div className="flex items-center gap-2">
														<button
															className="text-xs px-2 py-1 rounded bg-secondary hover:bg-secondary/80 cursor-pointer"
															onClick={(e) => {
																e.preventDefault();
																e.stopPropagation();
																setConfirmDeleteId(null);
															}}
														>
															Cancel
														</button>
														<button
															className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-600/90 cursor-pointer"
															onClick={(e) => {
																e.preventDefault();
																e.stopPropagation();
																void (async () => {
																	try {
																		await lix.db
																			.deleteFrom("version")
																			.where("id", "=", v.id)
																			.execute();
																	} finally {
																		setConfirmDeleteId(null);
																	}
																})();
															}}
														>
															Delete
														</button>
													</div>
												) : (
													<button
														className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground cursor-pointer"
														aria-label={`Delete ${v.name}`}
														title={`Delete ${v.name}`}
														onClick={(e) => {
															e.preventDefault();
															e.stopPropagation();
															setConfirmDeleteId(v.id);
														}}
													>
														<Trash2 className="size-4" />
													</button>
												)}
											</div>
										</div>
									</CommandItem>
								);
							})}
						</CommandGroup>
						<CommandGroup>
							<CommandItem value="__create" onSelect={() => void onCreate()}>
								<Plus className="mr-2 size-4" /> Create new version
							</CommandItem>
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
