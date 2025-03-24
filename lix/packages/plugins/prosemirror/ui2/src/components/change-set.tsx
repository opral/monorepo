import type React from "react";
import { useEffect, type ReactNode } from "react";
import {
	ChevronRight,
	Eye,
	EyeOff,
	History,
	RotateCcwIcon,
} from "lucide-react";
import clsx from "clsx";
import type { User } from "./user-context";
import type { Comment, Change } from "./change-set-context";
import { useChangeSets } from "./change-set-context";
import { Discussion } from "./discussion";
import { Button } from "./ui/button";
import { Avatar } from "./ui/avatar";

interface ChangeSetProps {
	id: string;
	title: string;
	subtitle: string;
	timestamp: string;
	author: User;
	isSelected: boolean;
	onClick: (id: string) => void;
	children?: ReactNode;
	comments: Comment[];
	changes: Change[];
	type: "proposal" | "checkpoint";
	diffViewChangeSet: string | null;
	isCurrent?: boolean;
	labelColor?: string;
	parentId?: string;
	hideUndoRestore?: boolean;
	customActions?: ReactNode;
}

export function ChangeSet({
	id,
	title,
	subtitle,
	timestamp,
	author,
	isSelected,
	onClick,
	children,
	comments,
	changes,
	type,
	diffViewChangeSet,
	isCurrent = false,
	labelColor = "bg-gray-100 text-gray-800",
	parentId,
	hideUndoRestore = false,
	customActions,
}: ChangeSetProps) {
	// Get the display title from the first comment if available
	const displayTitle = getDisplayTitle(comments, type, title);
	const {
		setSelectedChangeSet,
		setDiffViewChangeSet,
		undoChangeSet,
		restoreChangeSet,
	} = useChangeSets();

	// Check if diff view is currently showing for this change set
	const isShowingDiff = diffViewChangeSet === id;

	// Toggle diff view
	const toggleDiffView = () => {
		if (isShowingDiff) {
			setDiffViewChangeSet(null);
		} else {
			setDiffViewChangeSet(id);
		}
	};

	// Handle undo action
	const handleUndo = (e: React.MouseEvent) => {
		e.stopPropagation(); // Prevent collapsing the change set
		undoChangeSet(id);
	};

	// Handle restore action
	const handleRestore = (e: React.MouseEvent) => {
		e.stopPropagation(); // Prevent collapsing the change set
		restoreChangeSet(id);
	};

	// Add event listener for Escape key
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isSelected) {
				// Collapse the change set when Escape is pressed
				setSelectedChangeSet(null);
				setDiffViewChangeSet(null);
			}
		};

		// Add the event listener when the change set is selected
		if (isSelected) {
			document.addEventListener("keydown", handleKeyDown);
		}

		// Clean up the event listener when the component unmounts or when isSelected changes
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isSelected, setSelectedChangeSet, setDiffViewChangeSet]);

	return (
		<div className="border-b">
			<div
				className={clsx(
					"flex items-center p-2 cursor-pointer hover:bg-muted/10",
					isSelected && "bg-muted/10",
				)}
				onClick={() => onClick(id)}
			>
				<Avatar
					initials={author.initials}
					size="sm"
					className="mr-2 shrink-0"
				/>
				<div className="flex-1">
					<div className="text-sm truncate">{displayTitle}</div>
					<div className="text-xs text-muted-foreground">{subtitle}</div>
				</div>
				<ChevronRight
					className={clsx(
						"h-3 w-3 text-muted-foreground transition-transform",
						isSelected && "transform rotate-90",
					)}
				/>
			</div>

			{isSelected && (
				<div className="border-t">
					{/* Changes count bar with action buttons */}
					<div className="flex items-center justify-between p-2 bg-gray-50 border-b">
						<div className="text-sm font-medium">
							{changes.length} {changes.length === 1 ? "change" : "changes"}
						</div>
						<div className="flex items-center gap-1">
							{!hideUndoRestore && type !== "proposal" && (
								<>
									<Button
										size="sm"
										className="h-6 w-6 p-0"
										onClick={handleUndo}
										title="Undo this change set"
									>
										<RotateCcwIcon className="h-4 w-4" />
									</Button>

									<Button
										size="sm"
										className="h-6 w-6 p-0"
										onClick={handleRestore}
										title="Restore to this change set"
									>
										<History className="h-4 w-4" />
									</Button>
								</>
							)}

							<Button
								size="sm"
								className="h-6 text-xs px-2 py-0.5 flex items-center gap-1 ml-1"
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
					</div>

					{/* Content - now using the Discussion component */}
					<Discussion
						changeSetId={id}
						autoFocus={true}
						hideSubmitButton={type === "checkpoint"}
						customActions={customActions}
					/>
				</div>
			)}
		</div>
	);
}

// Helper function to extract and format the title from comments
function getDisplayTitle(
	comments: Comment[],
	type: "proposal" | "checkpoint",
	defaultTitle: string,
): string {
	// If there are no comments, use the default title
	if (comments.length === 0) {
		return defaultTitle;
	}

	// Get the first comment's text
	const firstCommentText = comments[0].text;

	// Extract the first line or sentence (whichever comes first)
	let title = firstCommentText.split(/[.\n]/, 1)[0].trim();

	// Truncate if too long (more than 30 characters)
	if (title.length > 30) {
		title = title.substring(0, 27) + "...";
	}

	return title;
}
