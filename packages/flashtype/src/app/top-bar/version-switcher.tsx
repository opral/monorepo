import { useCallback, useState } from "react";
import {
	useLix,
	useQuery,
	useQueryTakeFirstOrThrow,
} from "@lix-js/react-utils";
import { createVersion, switchVersion } from "@lix-js/sdk";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, ChevronDown, GitBranch, Loader2, Plus } from "lucide-react";
import clsx from "clsx";

/**
 * Dropdown trigger that lists available versions and switches the active one.
 *
 * Versions are queried reactively from the underlying Lix store. Selecting
 * another version updates the `active_version` row via `switchVersion`, which
 * in turn refreshes any subscribers (e.g. editors watching the active version).
 *
 * @example
 * <VersionSwitcher />
 */
export function VersionSwitcher() {
	const lix = useLix();

	const versions = useQuery(({ lix }) =>
		lix.db
			.selectFrom("version")
			.select([
				"id",
				"name",
				"hidden",
				"inherits_from_version_id",
				"commit_id",
				"working_commit_id",
			])
			.where("hidden", "!=", true)
			.orderBy("name", "asc"),
	);

	const activeVersion = useQueryTakeFirstOrThrow(() =>
		lix.db
			.selectFrom("active_version")
			.innerJoin("version", "version.id", "active_version.version_id")
			.select(["version.id", "version.name"]),
	);

	const [pendingAction, setPendingAction] = useState<string | null>(null);

	const handleSwitch = useCallback(
		async (versionId: string) => {
			if (!lix || versionId === activeVersion.id) return;
			setPendingAction(versionId);
			try {
				await switchVersion({ lix, to: { id: versionId } });
			} catch (error) {
				console.error("Failed to switch version", error);
			} finally {
				setPendingAction(null);
			}
		},
		[lix, activeVersion.id],
	);

	const handleCreateVersion = useCallback(async () => {
		if (!lix) return;
		const suggestion = `draft-${versions.length + 1}`;
		const entered = window.prompt("Name the new version", suggestion);
		if (entered === null) return;
		const trimmed = entered.trim();
		setPendingAction("create");
		try {
			const created = await createVersion({
				lix,
				name: trimmed.length > 0 ? trimmed : undefined,
			});
			await switchVersion({ lix, to: { id: created.id } });
		} catch (error) {
			console.error("Failed to create version", error);
		} finally {
			setPendingAction(null);
		}
	}, [lix, versions.length]);

	const buttonLabel = `${activeVersion.name}`;
	const isBusy = pendingAction !== null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="inline-flex h-7 items-center gap-1 rounded-md px-2 font-medium text-neutral-900 hover:bg-neutral-200"
					aria-label="Select version"
				>
					<GitBranch className="h-3.5 w-3.5" />
					<span className="text-xs">{buttonLabel}</span>
					{isBusy ? (
						<Loader2 className="h-3 w-3 animate-spin" />
					) : (
						<ChevronDown className="h-3 w-3" />
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="min-w-[180px] text-xs"
				align="start"
				sideOffset={6}
			>
				<DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-neutral-500">
					Versions
				</DropdownMenuLabel>
				{versions.length === 0 ? (
					<div className="px-3 py-2 text-muted-foreground">
						No versions available
					</div>
				) : (
					versions.map((version) => {
						const isActive = version.id === activeVersion.id;
						return (
							<DropdownMenuItem
								key={version.id}
								onSelect={() => handleSwitch(version.id)}
								className={clsx(
									"flex items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-xs",
									isActive ? "text-neutral-900" : "text-neutral-600",
								)}
							>
								<span className="truncate">{version.name}</span>
								{isActive ? (
									<Check className="h-3 w-3 flex-shrink-0 text-brand-600" />
								) : null}
							</DropdownMenuItem>
						);
					})
				)}
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onSelect={handleCreateVersion}
					className="flex items-center gap-2 px-2 py-1.5 text-xs text-neutral-600"
				>
					<Plus className="h-3 w-3" />
					<span>Create version</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
