import { Button } from "@/components/ui/button.js";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog.js";
import { Version } from "@lix-js/sdk";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select.js";
import { useState, useEffect } from "react";
import { mergeVersion } from "@lix-js/sdk";

interface MergeDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	versions: Version[];
	currentVersion: Version;
	lix: any;
	initialSourceVersion: Version | null;
	onMergeComplete: () => void;
}

export function MergeDialog({
	open,
	onOpenChange,
	versions,
	currentVersion,
	lix,
	initialSourceVersion,
	onMergeComplete,
}: MergeDialogProps) {
	const [targetVersion, setTargetVersion] = useState<string>(currentVersion.id);
	const [sourceVersion, setSourceVersion] = useState<string>(
		initialSourceVersion?.id || ""
	);

	useEffect(() => {
		if (open) {
			setTargetVersion(currentVersion.id);
			setSourceVersion(initialSourceVersion?.id || "");
		}
	}, [open, currentVersion, initialSourceVersion]);

	const handleMerge = async () => {
		try {
			const source = versions.find((v) => v.id === sourceVersion);
			const target = versions.find((v) => v.id === targetVersion);

			if (!source || !target) return;

			await mergeVersion({
				lix,
				sourceVersion: source,
				targetVersion: target,
			});

			onMergeComplete();
			onOpenChange(false);
		} catch (error) {
			console.error("Merge failed:", error);
			alert("Merge failed. See console for details.");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Merge Changes</DialogTitle>
					<p className="text-sm text-muted-foreground">
						You are about to merge changes versions. This will bring all changes
						from the source version into your target version.
					</p>
				</DialogHeader>
				<div className="py-4 space-y-4">
					<div className="space-y-2">
						<label className="text-sm font-medium">Target Version</label>
						<Select value={targetVersion} onValueChange={setTargetVersion}>
							<SelectTrigger>
								<SelectValue>{currentVersion.name}</SelectValue>
							</SelectTrigger>
							<SelectContent>
								{versions.map((version) => (
									<SelectItem
										key={version.id}
										value={version.id}
										disabled={version.id === sourceVersion}
									>
										{version.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-xs text-muted-foreground">
							This is the version that will receive the changes
						</p>
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium">Source Version</label>
						<Select value={sourceVersion} onValueChange={setSourceVersion}>
							<SelectTrigger>
								<SelectValue placeholder="Select version to merge from" />
							</SelectTrigger>
							<SelectContent>
								{versions.map((version) => (
									<SelectItem
										key={version.id}
										value={version.id}
										disabled={version.id === targetVersion}
									>
										{version.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-xs text-muted-foreground">
							Select the version whose changes you want to merge
						</p>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						variant="default"
						onClick={handleMerge}
						disabled={!sourceVersion || sourceVersion === targetVersion}
					>
						Merge Changes
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
