import { Clock, ChevronRight, Eye, EyeOff } from "lucide-react";
import { useChangeSets } from "./change-set-context";
import clsx from "clsx";
import { Button } from "./ui/button";

export function LatestChanges() {
	const {
		activeVersion,
		createCheckpoint,
		selectedChangeSet,
		setSelectedChangeSet,
		diffViewChangeSet,
		setDiffViewChangeSet,
	} = useChangeSets();

	// Create a unique ID for the latest changes
	const latestChangesId = `latest-changes-${activeVersion}`;

	// Check if this change set is selected
	const isSelected = selectedChangeSet === latestChangesId;

	// Check if diff view is currently showing
	const isShowingDiff = diffViewChangeSet === latestChangesId;

	// Mock changes for the latest changes
	const changes = [
		{
			id: "latest-change-1",
			type: "addition" as const,
			description: "New content added",
		},
		{
			id: "latest-change-2",
			type: "modification" as const,
			description: "Content modified",
		},
	];

	const handleCreateChangeSet = () => {
		createCheckpoint();
	};

	// Handle click to expand/collapse
	const handleClick = () => {
		if (isSelected) {
			// Collapse
			setSelectedChangeSet(null);
			setDiffViewChangeSet(null);
		} else {
			// Expand without showing diff view
			setSelectedChangeSet(latestChangesId);
		}
	};

	// Toggle diff view
	const toggleDiffView = () => {
		if (isShowingDiff) {
			setDiffViewChangeSet(null);
		} else {
			setDiffViewChangeSet(latestChangesId);
		}
	};

	return (
		<div className="border-b">
			{/* Header - similar to ChangeSet but always showing as selected */}
			<div
				className={clsx(
					"flex items-center p-2 cursor-pointer hover:bg-muted/10",
					isSelected && "bg-muted/10",
				)}
				onClick={handleClick}
			>
				<div className="h-6 w-6 mr-2 bg-blue-100 rounded-full flex items-center justify-center text-xs shrink-0">
					<Clock className="h-3 w-3" />
				</div>
				<div className="flex-1">
					<div className="text-sm font-medium">Current change set</div>
					<div className="text-xs text-muted-foreground">
						Auto-saved changes
					</div>
				</div>
				<ChevronRight
					className={clsx(
						"h-3 w-3 text-muted-foreground transition-transform",
						isSelected && "transform rotate-90",
					)}
				/>
			</div>

			{/* Only show content area when selected */}
			{isSelected && (
				<div className="border-t">
					{/* Changes count bar */}
					<div className="flex items-center justify-between p-2 bg-gray-50 border-b">
						<div className="text-sm font-medium">
							{changes.length} {changes.length === 1 ? "change" : "changes"}
						</div>
						<Button
							size="sm"
							className="h-6 text-xs px-2 py-0.5 flex items-center gap-1"
							onClick={toggleDiffView}
						>
							{isShowingDiff ? (
								<>
									<EyeOff className="h-3 w-3 mr-1" />
									Hide diff
								</>
							) : (
								<>
									<Eye className="h-3 w-3 mr-1" />
									View diff
								</>
							)}
						</Button>
					</div>

					{/* Comment area */}
					<div className="p-3">
						<div className="mb-3">
							<div className="text-xs text-muted-foreground">
								Add a description for this checkpoint.
							</div>
						</div>

						<div className="flex justify-end">
							<Button
								size="sm"
								className="border rounded-sm px-3 py-1 text-xs"
								onClick={handleCreateChangeSet}
							>
								Create checkpoint
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
