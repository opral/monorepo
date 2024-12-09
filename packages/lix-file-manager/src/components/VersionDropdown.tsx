import { useAtom } from "jotai";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button.js";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu.js";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog.js";
import IconBranch from "@/components/icons/IconBranch.js";
import { currentVersionAtom, existingVersionsAtom, lixAtom } from "../state.js";
import {
	Version,
	applyChanges,
	changeIsLeafInVersion,
	createVersion,
	switchVersion,
} from "@lix-js/sdk";
import { saveLixToOpfs } from "../helper/saveLixToOpfs.js";
import { humanId } from "human-id";
import { Plus, Check, Trash2 } from "lucide-react";

export function VersionDropdown() {
	const [currentVersion] = useAtom(currentVersionAtom);
	const [existingVersions] = useAtom(existingVersionsAtom);
	const [lix] = useAtom(lixAtom);
	const [versionToDelete, setVersionToDelete] = useState<Version | null>(null);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [deleteConfirmation, setDeleteConfirmation] = useState("");

	const switchToVersion = useCallback(
		async (version: Version) => {
			if (!lix) return;

			await lix.db.transaction().execute(async (trx) => {
				await switchVersion({ lix: { ...lix, db: trx }, to: version });

				const changesOfVersion = await trx
					.selectFrom("change")
					.where(changeIsLeafInVersion(version))
					.innerJoin("snapshot", "snapshot.id", "change.snapshot_id")
					.selectAll("change")
					.select("snapshot.content")
					.execute();

				await applyChanges({
					lix: { ...lix, db: trx },
					changes: changesOfVersion,
				});
			});

			await saveLixToOpfs({ lix });
		},
		[lix]
	);

	const handleCreateVersion = useCallback(async () => {
		if (!lix || !currentVersion) return;

		const newVersion = await createVersion({
			lix,
			parent: currentVersion,
			name: humanId({
				separator: "-",
				capitalize: false,
				adjectiveCount: 0,
			}),
		});

		await switchToVersion(newVersion);
	}, [lix, currentVersion, switchToVersion]);

	const handleDeleteVersion = async (version: Version) => {
		if (!lix) return;

		await lix.db.transaction().execute(async (trx) => {
			// First delete version_change references
			await trx
				.deleteFrom("version_change")
				.where("version_change.version_id", "=", version.id)
				.execute();

			// Then delete the version itself
			await trx.deleteFrom("version").where("id", "=", version.id).execute();
		});

		await saveLixToOpfs({ lix });

		// Close both dialog and dropdown
		setVersionToDelete(null);
		setDropdownOpen(false);
		window.dispatchEvent(new Event("version-changed"));
	};

	if (!currentVersion) return null;

	return (
		<>
			<DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" size="sm" className="gap-2">
						<IconBranch />
						{currentVersion.name}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-56">
					{existingVersions?.map((version) => (
						<DropdownMenuItem
							key={version.id}
							onClick={() => switchToVersion(version)}
							className="flex items-center justify-between group"
						>
							<span>{version.name}</span>
							{version.id === currentVersion.id ? (
								<Check className="h-4 w-4 opacity-50" />
							) : version.name !== "main" ? (
								<Button
									variant="ghost"
									size="sm"
									className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
									onClick={(e) => {
										e.stopPropagation();
										setVersionToDelete(version);
									}}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							) : null}
						</DropdownMenuItem>
					))}
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={handleCreateVersion}>
						<Plus className="mr-2 h-4 w-4" />
						Create branch
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<Dialog
				open={!!versionToDelete}
				onOpenChange={() => {
					setVersionToDelete(null);
					setDeleteConfirmation("");
				}}
			>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Delete Branch</DialogTitle>
					</DialogHeader>
					<div className="py-4 space-y-4">
						<p className="text-sm text-muted-foreground">
							Are you sure you want to delete the branch "
							{versionToDelete?.name}"? This action cannot be undone.
						</p>
						<div className="space-y-2">
							<label htmlFor="confirmation" className="text-sm font-medium">
								Please type{" "}
								<span className="font-mono">{versionToDelete?.name}</span> to
								confirm.
							</label>
							<input
								id="confirmation"
								type="text"
								value={deleteConfirmation}
								onChange={(e) => setDeleteConfirmation(e.target.value)}
								className="w-full px-3 py-2 border rounded-md text-sm"
								placeholder={`Type "${versionToDelete?.name}" to confirm`}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setVersionToDelete(null);
								setDeleteConfirmation("");
							}}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							disabled={deleteConfirmation !== versionToDelete?.name}
							onClick={() => {
								if (
									versionToDelete &&
									deleteConfirmation === versionToDelete.name
								) {
									handleDeleteVersion(versionToDelete);
									setDeleteConfirmation("");
								}
							}}
						>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
