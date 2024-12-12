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
import { useState } from "react";
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
	const [sourceVersion, setSourceVersion] = useState<string>(
		initialSourceVersion?.id || ""
	);
	const [targetVersion, setTargetVersion] = useState<string>(currentVersion.id);

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
					<DialogTitle>Merge Versions</DialogTitle>
				</DialogHeader>
				<div className="py-4 space-y-4">
					<div className="space-y-2">
						<label className="text-sm font-medium">Source Version</label>
						<Select value={sourceVersion} onValueChange={setSourceVersion}>
							<SelectTrigger>
								<SelectValue placeholder="Select source version" />
							</SelectTrigger>
							<SelectContent>
								{versions.map((version) => (
									<SelectItem key={version.id} value={version.id}>
										{version.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<label className="text-sm font-medium">Target Version</label>
						<Select value={targetVersion} onValueChange={setTargetVersion}>
							<SelectTrigger>
								<SelectValue placeholder="Select target version" />
							</SelectTrigger>
							<SelectContent>
								{versions.map((version) => (
									<SelectItem key={version.id} value={version.id}>
										{version.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						variant="default"
						onClick={handleMerge}
						disabled={
							!sourceVersion ||
							!targetVersion ||
							sourceVersion === targetVersion
						}
					>
						Merge
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
