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
import {
	currentVersionAtom,
	existingVersionsAtom,
	lixAtom,
	serverUrlAtom,
} from "../state.js";
import { Version, createVersion, switchVersion } from "@lix-js/sdk";
import { saveLixToOpfs } from "../helper/saveLixToOpfs.js";
import { humanId } from "human-id";
import { Check, Trash2, ChevronDown, Plus } from "lucide-react";
import { MergeDialog } from "./MergeDialog.js";
import IconMerge from "./icons/IconMerge.js";

export function VersionDropdown() {
	const [currentVersion] = useAtom(currentVersionAtom);
	const [existingVersions] = useAtom(existingVersionsAtom);
	const [lix] = useAtom(lixAtom);
	const [serverUrl] = useAtom(serverUrlAtom);
	const [versionToDelete, setVersionToDelete] = useState<Version | null>(null);
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [deleteConfirmation, setDeleteConfirmation] = useState("");
	const [isHovered, setIsHovered] = useState(false);
	const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
	const [selectedSourceVersion, setSelectedSourceVersion] =
		useState<Version | null>(null);

	const switchToVersion = useCallback(
		async (version: Version) => {
			if (!lix) return;
			await switchVersion({ lix, to: version });
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

	const handleSync = async () => {
		if (!lix) return;

		try {
			const response = await fetch(
				new Request(`http://localhost:3000/lsa/new-v1`, {
					method: "POST",
					body: await lix.toBlob(),
				})
			);

			if (response.ok === false && response.status !== 409) {
				throw new Error(`Failed to sync: ${response.status}`);
			}

			await lix.db
				.insertInto("key_value")
				.values({
					key: "lix_experimental_server_url",
					value: "http://localhost:3000",
				})
				.execute();

			await saveLixToOpfs({ lix });
		} catch (error) {
			console.error("Sync failed:", error);
		}
	};

	const handleStopSync = async () => {
		if (!lix) return;
		await lix.db
			.deleteFrom("key_value")
			.where("key", "=", "lix_experimental_server_url")
			.execute();
		await saveLixToOpfs({ lix });
	};

	if (!currentVersion) return null;

	return (
		<>
			<div className="flex flex-col gap-2 mr-2">
				<div className="flex gap-2">
					<DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
						<DropdownMenuTrigger asChild>
							<Button
								variant="secondary"
								size="default"
								className="gap-2 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							>
								{currentVersion.name}
								<ChevronDown className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="w-56">
							{existingVersions?.map((version) => (
								<DropdownMenuItem
									key={version.id}
									onClick={() => switchToVersion(version)}
									className="flex items-center justify-between group"
								>
									<div className="flex items-center gap-2">
										<span>{version.name}</span>
									</div>
									<div className="flex items-center gap-1">
										{version.id === currentVersion.id ? (
											<Check className="h-4 w-4 opacity-50" />
										) : (
											<>
												<Button
													variant="ghost"
													size="sm"
													className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
													onClick={(e) => {
														e.stopPropagation();
														setSelectedSourceVersion(version);
														setMergeDialogOpen(true);
													}}
												>
													<IconMerge />
												</Button>
												{version.name !== "main" && (
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
												)}
											</>
										)}
									</div>
								</DropdownMenuItem>
							))}
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={handleCreateVersion}>
								<Plus />
								Create new version
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
					{!serverUrl ? (
						<Button
							variant="secondary"
							size="default"
							onClick={handleSync}
							className="gap-2 relative pr-8"
						>
							Sync
							<div className="w-2 h-2 rounded-full bg-slate-400 absolute right-3" />
						</Button>
					) : (
						<div
							className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-100 cursor-pointer"
							onClick={handleStopSync}
							onMouseEnter={() => setIsHovered(true)}
							onMouseLeave={() => setIsHovered(false)}
						>
							<span className="text-sm text-slate-700">
								{isHovered ? "Stop syncing" : "Syncing"}
							</span>
							<div
								className={`w-2 h-2 rounded-full ${isHovered ? "bg-red-600" : "bg-green-600"}`}
							/>
						</div>
					)}
				</div>
			</div>

			<Dialog
				open={!!versionToDelete}
				onOpenChange={() => {
					setVersionToDelete(null);
					setDeleteConfirmation("");
				}}
			>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Delete Version</DialogTitle>
					</DialogHeader>
					<div className="py-4 space-y-4">
						<p className="text-sm text-muted-foreground">
							Are you sure you want to delete the version "
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

			<MergeDialog
				open={mergeDialogOpen}
				onOpenChange={(open) => {
					setMergeDialogOpen(open);
					if (!open) setSelectedSourceVersion(null);
				}}
				versions={existingVersions}
				currentVersion={currentVersion}
				lix={lix}
				initialSourceVersion={selectedSourceVersion}
				onMergeComplete={() => {
					setMergeDialogOpen(false);
					setSelectedSourceVersion(null);
					window.dispatchEvent(new Event("version-changed"));
				}}
			/>
		</>
	);
}