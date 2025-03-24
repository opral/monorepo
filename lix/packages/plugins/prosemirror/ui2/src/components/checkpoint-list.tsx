import { useState } from "react";
import { ChangeSet } from "./change-set";
import { useChangeSets } from "./change-set-context";
import { useRef, useEffect } from "react";
import { Clock, Eye, EyeOff, ChevronRight } from "lucide-react";
import { useUser } from "./user-context";
import { Discussion } from "./discussion";
import { Button } from "./ui/button";
import clsx from "clsx";

// Predefined label options
const LABEL_OPTIONS = [
	{ value: "feature", label: "Feature" },
	{ value: "bugfix", label: "Bug Fix" },
	{ value: "improvement", label: "Improvement" },
	{ value: "docs", label: "Documentation" },
	{ value: "test", label: "Test" },
	{ value: "style", label: "Style" },
	{ value: "other", label: "Other" },
];

// Special component for Latest Changes that looks like an uncollapsed ChangeSet
export function LatestChanges() {
	const {
		activeVersion,
		createChangeSet,
		diffViewChangeSet,
		setDiffViewChangeSet,
		selectedChangeSet,
		setSelectedChangeSet,
	} = useChangeSets();
	const { currentUser } = useUser();
	const [selectedLabel, setSelectedLabel] = useState(LABEL_OPTIONS[0]);

	// Create a unique ID for the latest changes
	const latestChangesId = `latest-changes-${activeVersion}`;

	// Check if this change set is selected
	const isSelected = selectedChangeSet === latestChangesId;

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

	// Check if diff view is currently showing for latest changes
	const isShowingDiff = diffViewChangeSet === latestChangesId;

	// Toggle diff view
	const toggleDiffView = () => {
		if (isShowingDiff) {
			setDiffViewChangeSet(null);
		} else {
			setDiffViewChangeSet(latestChangesId);
		}
	};

	// Handle creating a change set with the selected label
	const handleCreateChangeSet = () => {
		createChangeSet(selectedLabel.label);
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

			{/* Content area - only show when selected */}
			{isSelected && (
				<div className="border-t">
					{/* Changes count bar with Show diff button */}
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

					{/* Using the Discussion component */}
					<Discussion
						changeSetId={latestChangesId}
						autoFocus={false}
						customActions={
							<div className="flex justify-end">
								{activeVersion === "main" ? (
									<Button
										size="sm"
										className="border rounded-sm px-3 py-1 text-xs"
										onClick={handleCreateChangeSet}
									>
										Create checkpoint
									</Button>
								) : (
									<div className="text-xs text-muted-foreground">
										Checkpoints can only be created in the main version
									</div>
								)}
							</div>
						}
						placeholderText="Add a comment..."
						preventCheckpointOnEnter={true}
					/>
				</div>
			)}
		</div>
	);
}

export function CheckpointList() {
	const {
		changeSets,
		selectedChangeSet,
		newlyCreatedChangeSet,
		diffViewChangeSet,
		activeVersion,
		hasUnsavedChanges,
		currentVersion,
		setNewlyCreatedChangeSet,
		handleChangeSetClick,
		setSelectedChangeSet,
		setDiffViewChangeSet,
	} = useChangeSets();

	// Filter to only show change sets for the current version
	const versionChangeSets = changeSets.filter(
		(changeSet) => changeSet.version === activeVersion,
	);

	// Add this inside the CheckpointList component
	const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

	// Add this useEffect to focus the textarea when a new change set is created
	useEffect(() => {
		if (newlyCreatedChangeSet && textareaRefs.current[newlyCreatedChangeSet]) {
			// Focus the textarea
			textareaRefs.current[newlyCreatedChangeSet]?.focus();
			// Reset the newly created change set
			setNewlyCreatedChangeSet(null);
		}
	}, [newlyCreatedChangeSet, setNewlyCreatedChangeSet]);

	// Check if there are unsaved changes for the current version
	const showLatestChanges = hasUnsavedChanges[activeVersion];

	// Auto-expand the current change set when the component mounts, but don't show diff view
	useEffect(() => {
		if (showLatestChanges) {
			const latestChangesId = `latest-changes-${activeVersion}`;
			setSelectedChangeSet(latestChangesId);
			// Don't set diffViewChangeSet here
		}
	}, [activeVersion, showLatestChanges, setSelectedChangeSet]);

	// Handle change set click with collapsing current change set
	const handleChangeSetClickWithCollapse = (id: string) => {
		// If we're clicking on a change set, collapse the current change set
		const latestChangesId = `latest-changes-${activeVersion}`;
		if (selectedChangeSet === latestChangesId) {
			setSelectedChangeSet(null);
		}

		// Then handle the regular change set click
		handleChangeSetClick(id);
	};

	return (
		<div className="flex flex-col h-full">
			<div className="flex-1 overflow-auto">
				{/* Show Latest Changes if there are unsaved changes and we're on main */}
				{showLatestChanges && activeVersion === "main" && <LatestChanges />}

				{versionChangeSets.length > 0 ? (
					<div className="space-y-0">
						{versionChangeSets.map((changeSet) => (
							<ChangeSet
								key={changeSet.id}
								id={changeSet.id}
								title={changeSet.title}
								subtitle={changeSet.subtitle}
								timestamp={changeSet.timestamp}
								author={changeSet.author}
								isSelected={selectedChangeSet === changeSet.id}
								onClick={handleChangeSetClickWithCollapse}
								comments={changeSet.comments}
								changes={changeSet.changes}
								type={changeSet.type}
								diffViewChangeSet={diffViewChangeSet}
								isCurrent={changeSet.id === currentVersion}
								labelColor={changeSet.labelColor}
								parentId={changeSet.parentId}
							/>
						))}
					</div>
				) : (
					<div className="p-4 text-center text-sm text-gray-500">
						No change sets available for this version
					</div>
				)}
			</div>
		</div>
	);
}
