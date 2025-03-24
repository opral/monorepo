import {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from "react";
import { type User, useUser } from "./user-context";

export interface Comment {
	id: string;
	text: string;
	author: User;
	timestamp: string;
}

export interface Change {
	id: string;
	type: "addition" | "deletion" | "modification";
	description: string;
}

export interface ChangeSetData {
	id: string;
	title: string;
	subtitle: string;
	timestamp: string;
	author: User;
	type: "proposal" | "checkpoint";
	label?: string;
	labelColor?: string;
	comments: Comment[];
	changes: Change[];
	version?: string; // Associated version (for checkpoints)
	parentId?: string; // ID of the parent change set
}

// Sample data with the updated structure
const createInitialChangeSets = (currentUser: User): ChangeSetData[] => {
	// Create the initial change sets with parent-child relationships
	const changeSet3 = {
		id: "cs-3",
		title: "Initial setup",
		subtitle: "Yesterday, 4:45 PM",
		timestamp: "Yesterday, 4:45 PM",
		author: currentUser,
		type: "checkpoint" as const,
		label: "Feature",
		version: "main",
		comments: [
			{
				id: "comment-5",
				text: "Created the initial document structure.",
				author: currentUser,
				timestamp: "Yesterday, 4:45 PM",
			},
		],
		changes: [
			{
				id: "change-11",
				type: "addition" as const,
				description: "Created document outline",
			},
			{
				id: "change-12",
				type: "addition" as const,
				description: "Set up document formatting",
			},
		],
	};

	const changeSet2 = {
		id: "cs-2",
		title: "Add introduction",
		subtitle: "Today, 9:30 AM",
		timestamp: "Today, 9:30 AM",
		author: currentUser,
		type: "checkpoint" as const,
		label: "Documentation",
		version: "main",
		parentId: changeSet3.id,
		comments: [
			{
				id: "comment-4",
				text: "Added the introduction section with key points.",
				author: currentUser,
				timestamp: "Today, 9:30 AM",
			},
		],
		changes: [
			{
				id: "change-10",
				type: "addition" as const,
				description: "Added introduction section",
			},
		],
	};

	const changeSet1 = {
		id: "cs-1",
		title: "Complete first draft",
		subtitle: "Today, 10:15 AM",
		timestamp: "Today, 10:15 AM",
		author: currentUser,
		type: "checkpoint" as const,
		label: "Feature",
		version: "main",
		parentId: changeSet2.id,
		comments: [
			{
				id: "comment-3",
				text: "Completed the first draft of the document.",
				author: currentUser,
				timestamp: "Today, 10:15 AM",
			},
		],
		changes: [
			{
				id: "change-6",
				type: "addition" as const,
				description: "Added complete first draft",
			},
			{
				id: "change-7",
				type: "addition" as const,
				description: "Added references section",
			},
			{
				id: "change-8",
				type: "addition" as const,
				description: "Added executive summary",
			},
			{
				id: "change-9",
				type: "addition" as const,
				description: "Added appendix",
			},
		],
	};

	// Create proposals
	const proposal1 = {
		id: "0195bee0",
		title: "Changes to introduction",
		subtitle: "10 minutes ago",
		timestamp: "10 minutes ago",
		author: currentUser,
		type: "proposal" as const,
		comments: [
			{
				id: "comment-1",
				text: "I've made some changes to the introduction paragraph.",
				author: currentUser,
				timestamp: "10 minutes ago",
			},
		],
		changes: [
			{
				id: "change-1",
				type: "addition" as const,
				description: "Added new introduction paragraph",
			},
			{
				id: "change-2",
				type: "deletion" as const,
				description: "Removed outdated information",
			},
			{
				id: "change-3",
				type: "modification" as const,
				description: "Updated project goals",
			},
		],
	};

	const proposal2 = {
		id: "0195bee1",
		title: "Fixed typos",
		subtitle: "1 hour ago",
		timestamp: "1 hour ago",
		author: currentUser,
		type: "proposal" as const,
		comments: [
			{
				id: "comment-2",
				text: "Fixed a few typos in the second section.",
				author: currentUser,
				timestamp: "1 hour ago",
			},
		],
		changes: [
			{
				id: "change-4",
				type: "modification" as const,
				description: "Fixed typo in paragraph 2",
			},
			{
				id: "change-5",
				type: "modification" as const,
				description: "Fixed spelling error in conclusion",
			},
		],
	};

	// Return all change sets in the order they should appear (newest first)
	return [changeSet1, changeSet2, changeSet3, proposal1, proposal2];
};

// Create a mapping of version current states
const createVersionCurrents = (
	changeSets: ChangeSetData[],
): Record<string, string> => {
	const currents: Record<string, string> = {};

	// Group change sets by version
	const versionChangeSets: Record<string, ChangeSetData[]> = {};

	changeSets.forEach((cs) => {
		if (cs.version && cs.type === "checkpoint") {
			if (!versionChangeSets[cs.version]) {
				versionChangeSets[cs.version] = [];
			}
			versionChangeSets[cs.version].push(cs);
		}
	});

	// For each version, find the change set with no children
	Object.entries(versionChangeSets).forEach(([version, changeSets]) => {
		// Create a set of all parent IDs
		const parentIds = new Set(
			changeSets.filter((cs) => cs.parentId).map((cs) => cs.parentId as string),
		);

		// Find the change set that is not a parent of any other change set
		const current = changeSets.find((cs) => !parentIds.has(cs.id));

		if (current) {
			currents[version] = current.id;
		}
	});

	return currents;
};

// Add the submitProposal function to the ChangeSetContext

// Update the ChangeSetContextType interface to include submitProposal
interface ChangeSetContextType {
	changeSets: ChangeSetData[];
	selectedChangeSet: string | null;
	newComments: Record<string, string>;
	newlyCreatedChangeSet: string | null;
	diffViewChangeSet: string | null;
	activeVersion: string;
	proposalChangeSet: ChangeSetData | null;
	hasUnsavedChanges: Record<string, boolean>;
	currentVersion: string | null;
	latestChangesComments: Record<string, Comment[]>;
	isCreatingNewVersion: boolean;
	setIsCreatingNewVersion: (value: boolean) => void;
	setNewlyCreatedChangeSet: (id: string | null) => void;
	setSelectedChangeSet: (id: string | null) => void;
	setDiffViewChangeSet: (id: string | null) => void;
	handleChangeSetClick: (id: string) => void;
	handleCommentChange: (id: string, comment: string) => void;
	addComment: (id: string) => void;
	addLatestChangesComment: (id: string, commentText: string) => void;
	createChangeSet: (label?: string, labelColor?: string) => void;
	acceptProposal: (proposalId: string) => void;
	rejectProposal: (proposalId: string) => void;
	createProposalDiff: () => void;
	setHasUnsavedChanges: (version: string, value: boolean) => void;
	undoChangeSet: (changeSetId: string) => void;
	restoreChangeSet: (changeSetId: string) => void;
	submitProposal: (proposalId: string) => void;
}

const ChangeSetContext = createContext<ChangeSetContextType | undefined>(
	undefined,
);

// Add the submitProposal function to the ChangeSetProvider
export function ChangeSetProvider({
	children,
	activeVersion,
}: {
	children: ReactNode;
	activeVersion: string;
}) {
	const { currentUser } = useUser();
	const [changeSets, setChangeSets] = useState<ChangeSetData[]>(() =>
		createInitialChangeSets(currentUser),
	);
	const [versionCurrents, setVersionCurrents] = useState<
		Record<string, string>
	>(() => createVersionCurrents(changeSets));
	const [selectedChangeSet, setSelectedChangeSet] = useState<string | null>(
		null,
	);
	const [newComments, setNewComments] = useState<Record<string, string>>({});
	const [newlyCreatedChangeSet, setNewlyCreatedChangeSet] = useState<
		string | null
	>(null);
	const [diffViewChangeSet, setDiffViewChangeSet] = useState<string | null>(
		null,
	);
	const [proposalChangeSet, setProposalChangeSet] =
		useState<ChangeSetData | null>(null);
	const [hasUnsavedChanges, setHasUnsavedChangesState] = useState<
		Record<string, boolean>
	>({});
	const [latestChangesComments, setLatestChangesComments] = useState<
		Record<string, Comment[]>
	>({});
	// Add a new state to track when a new version is being created
	const [isCreatingNewVersion, setIsCreatingNewVersion] = useState(false);

	// Get the current state for the active version
	const currentVersion = versionCurrents[activeVersion] || null;

	const setHasUnsavedChanges = (version: string, value: boolean) => {
		setHasUnsavedChangesState((prev) => ({
			...prev,
			[version]: value,
		}));
	};

	const handleChangeSetClick = (changeSetId: string) => {
		// Check if we're clicking on the currently selected change set (collapsing)
		if (changeSetId === selectedChangeSet) {
			// Collapse the change set
			setSelectedChangeSet(null);

			// Always close the diff view when collapsing a change set
			setDiffViewChangeSet(null);
		} else {
			// Expanding a different change set
			setSelectedChangeSet(changeSetId);

			// Don't automatically show the diff view for the expanded change set
			// This is the key change to not auto-open diff view
		}
	};

	const handleCommentChange = (changeSetId: string, comment: string) => {
		setNewComments((prev) => ({
			...prev,
			[changeSetId]: comment,
		}));
	};

	// New function to add a comment to latest changes without creating a checkpoint
	const addLatestChangesComment = (
		changeSetId: string,
		commentText: string,
	) => {
		if (!commentText || !commentText.trim()) return;

		// Create a new comment with the current user
		const newComment: Comment = {
			id: `comment-${Date.now()}`,
			text: commentText,
			author: currentUser,
			timestamp: formatTimestamp(new Date()),
		};

		// Add the comment to the latestChangesComments
		setLatestChangesComments((prev) => ({
			...prev,
			[changeSetId]: [...(prev[changeSetId] || []), newComment],
		}));

		// Clear the comment input
		setNewComments((prev) => ({
			...prev,
			[changeSetId]: "",
		}));
	};

	const addComment = (changeSetId: string) => {
		const commentText = newComments[changeSetId];
		if (!commentText || !commentText.trim()) return;

		// Check if this is for the proposal change set
		if (proposalChangeSet && changeSetId === proposalChangeSet.id) {
			// Create a new comment with the current user
			const newComment: Comment = {
				id: `comment-${Date.now()}`,
				text: commentText,
				author: currentUser,
				timestamp: formatTimestamp(new Date()),
			};

			// Update the proposal change set with the new comment
			setProposalChangeSet({
				...proposalChangeSet,
				comments: [...proposalChangeSet.comments, newComment],
			});
		} else if (changeSetId.startsWith("latest-changes")) {
			// This is a comment for the latest changes
			// Only create a change set if we're on main
			if (activeVersion === "main") {
				createChangeSetWithComment(commentText);
			} else {
				// For non-main versions, just add the comment without creating a checkpoint
				addLatestChangesComment(changeSetId, commentText);
			}
			return;
		} else {
			// Find the current changeSet in the regular change sets
			const currentChangeSet = changeSets.find((cs) => cs.id === changeSetId);

			// Check if this is a checkpoint and if it has no comments yet
			const isFirstChangeSetComment =
				currentChangeSet?.type === "checkpoint" &&
				currentChangeSet.comments.length === 0;

			// Create a new comment with the current user
			const newComment: Comment = {
				id: `comment-${Date.now()}`,
				text: commentText,
				author: currentUser,
				timestamp: formatTimestamp(new Date()),
			};

			// Update the changeSets with the new comment
			setChangeSets((prev) =>
				prev.map((changeSet) =>
					changeSet.id === changeSetId
						? { ...changeSet, comments: [...changeSet.comments, newComment] }
						: changeSet,
				),
			);

			// If this is the first comment for a checkpoint, collapse it after a short delay
			if (isFirstChangeSetComment) {
				// Small delay to allow the user to see the comment was added
				setTimeout(() => {
					setSelectedChangeSet(null);
					setDiffViewChangeSet(null);
				}, 300);
			}
		}

		// Clear the comment input
		setNewComments((prev) => ({
			...prev,
			[changeSetId]: "",
		}));
	};

	// Update the createChangeSetWithComment function to accept a label and color
	const createChangeSetWithComment = (
		commentText: string,
		label = "Feature",
	) => {
		// Only allow checkpoint creation in main version
		if (activeVersion !== "main") {
			console.warn("Checkpoints can only be created in the main version");
			return;
		}

		// Generate a timestamp
		const now = new Date();
		const timestamp = formatTimestamp(now);

		// Generate a unique ID
		const id = `cs-${Date.now()}`;

		// Create the new change set with a random number of changes (1-3)
		const changeCount = Math.floor(Math.random() * 3) + 1;
		const changes: Change[] = [];

		for (let i = 0; i < changeCount; i++) {
			changes.push({
				id: `change-${Date.now()}-${i}`,
				type: "addition",
				description: `Change ${i + 1} for new ${label.toLowerCase()}`,
			});
		}

		// Get the current version as the parent
		const parentId = versionCurrents[activeVersion] || undefined;

		// Create the new change set with the provided comment and label
		const newChangeSet: ChangeSetData = {
			id,
			title: commentText.split(/[.\n]/, 1)[0].trim() || label,
			subtitle: timestamp,
			timestamp,
			author: currentUser,
			type: "checkpoint",
			label,
			version: activeVersion,
			parentId,
			comments: [
				{
					id: `comment-${Date.now()}`,
					text: commentText,
					author: currentUser,
					timestamp: formatTimestamp(new Date()),
				},
			],
			changes,
		};

		// Add the change set to the list
		setChangeSets((prev) => [newChangeSet, ...prev]);

		// Update the version current
		setVersionCurrents((prev) => ({
			...prev,
			[activeVersion]: id,
		}));

		// Clear unsaved changes flag for this version
		setHasUnsavedChanges(activeVersion, false);

		// Clear the comment input for latest changes
		const latestChangesId = `latest-changes-${activeVersion}`;
		setNewComments((prev) => ({
			...prev,
			[latestChangesId]: "",
		}));

		// Clear any comments for the latest changes
		setLatestChangesComments((prev) => ({
			...prev,
			[latestChangesId]: [],
		}));

		// Close any diff view
		setDiffViewChangeSet(null);
		// Make sure all change sets are collapsed
		setSelectedChangeSet(null);
	};

	// Update the createChangeSet function to accept a label and color
	const createChangeSet = (label = "Feature") => {
		// Only allow checkpoint creation in main version
		if (activeVersion !== "main") {
			console.warn("Checkpoints can only be created in the main version");
			return;
		}

		// Rest of the function remains the same...
		const latestChangesId = `latest-changes-${activeVersion}`;
		const commentText = newComments[latestChangesId] || "";

		if (commentText.trim()) {
			// If there's a comment, use it to create the change set with the specified label
			createChangeSetWithComment(commentText, label);
		} else {
			// Otherwise create a change set without a comment but with the specified label
			// Generate a timestamp
			const now = new Date();
			const timestamp = formatTimestamp(now);

			// Generate a unique ID
			const id = `cs-${Date.now()}`;

			// Create the new change set with a random number of changes (1-3)
			const changeCount = Math.floor(Math.random() * 3) + 1;
			const changes: Change[] = [];

			for (let i = 0; i < changeCount; i++) {
				changes.push({
					id: `change-${Date.now()}-${i}`,
					type: "addition",
					description: `Change ${i + 1} for new ${label.toLowerCase()}`,
				});
			}

			// Get the current version as the parent
			const parentId = versionCurrents[activeVersion] || undefined;

			// Create the new change set with the specified label
			const newChangeSet: ChangeSetData = {
				id,
				title: label,
				subtitle: timestamp,
				timestamp,
				author: currentUser,
				type: "checkpoint",
				label,
				version: activeVersion,
				parentId,
				comments: [],
				changes,
			};

			// Add the change set to the list
			setChangeSets((prev) => [newChangeSet, ...prev]);

			// Update the version current
			setVersionCurrents((prev) => ({
				...prev,
				[activeVersion]: id,
			}));

			// Select the new change set
			// Don't select any change set to keep all collapsed
			setSelectedChangeSet(null);

			// Don't automatically show diff for the new change set
			// setDiffViewChangeSet(id)

			// Set as newly created change set to trigger focus
			setNewlyCreatedChangeSet(null);

			// Initialize empty comment for this change set
			setNewComments((prev) => ({
				...prev,
				[id]: "",
			}));

			// Clear unsaved changes flag for this version
			setHasUnsavedChanges(activeVersion, false);

			// Clear any comments for the latest changes
			setLatestChangesComments((prev) => ({
				...prev,
				[latestChangesId]: [],
			}));
		}
	};

	// Function to create a proposal diff view
	const createProposalDiff = () => {
		// Generate a timestamp
		const now = new Date();
		const timestamp = formatTimestamp(now);

		// Generate a unique ID for the proposal
		const id = `proposal-${Date.now()}`;

		// Create mock changes for the proposal
		const changes: Change[] = [
			{
				id: `change-${Date.now()}-1`,
				type: "addition",
				description: "Added new introduction paragraph",
			},
			{
				id: `change-${Date.now()}-2`,
				type: "deletion",
				description: "Removed outdated information",
			},
			{
				id: `change-${Date.now()}-3`,
				type: "modification",
				description: "Updated project goals",
			},
		];

		// Create the proposal change set with no comments initially
		const newProposalChangeSet: ChangeSetData = {
			id,
			title: "Proposed changes",
			subtitle: timestamp,
			timestamp,
			author: currentUser,
			type: "proposal",
			version: activeVersion, // Associate with the current version
			comments: [], // No initial comments
			changes,
		};

		// Set the proposal change set
		setProposalChangeSet(newProposalChangeSet);

		// Don't automatically show diff for the new proposal
		// setDiffViewChangeSet(id) - Remove this line to prevent auto-opening diff

		// Initialize empty comment for this proposal
		setNewComments((prev) => ({
			...prev,
			[id]: "",
		}));
	};

	// Function to accept a proposal and apply changes to main version
	const acceptProposal = (proposalId: string) => {
		// Find the proposal
		const proposal = changeSets.find(
			(cs) => cs.id === proposalId && cs.type === "proposal",
		);

		if (!proposal) return;

		// Create a new checkpoint in the main version based on the accepted proposal
		const now = new Date();
		const timestamp = formatTimestamp(now);
		const id = `cs-accepted-${Date.now()}`;

		// Get the current version of main as the parent
		const parentId = versionCurrents["main"] || undefined;

		const newChangeSet: ChangeSetData = {
			id,
			title: `Accepted: ${proposal.title}`,
			subtitle: timestamp,
			timestamp,
			author: currentUser,
			type: "checkpoint",
			label: "Accepted Proposal",
			labelColor: "bg-green-100 text-green-800",
			version: "main", // Always associate with main version
			parentId,
			comments: [
				{
					id: `comment-${Date.now()}`,
					text: `Accepted proposal: ${proposal.title}`,
					author: currentUser,
					timestamp: formatTimestamp(new Date()),
				},
			],
			changes: proposal.changes,
		};

		// Add the new checkpoint to the list
		setChangeSets((prev) => [newChangeSet, ...prev]);

		// Update the version current for main
		setVersionCurrents((prev) => ({
			...prev,
			main: id,
		}));

		// Remove the proposal from the list
		setChangeSets((prev) => prev.filter((cs) => cs.id !== proposalId));

		// Close any open diff view and selected change set
		setDiffViewChangeSet(null);
		setSelectedChangeSet(null);
	};

	// Function to reject a proposal
	const rejectProposal = (proposalId: string) => {
		// Find the proposal
		const proposal = changeSets.find(
			(cs) => cs.id === proposalId && cs.type === "proposal",
		);

		if (!proposal) return;

		// Simply remove the proposal from the list
		setChangeSets((prev) => prev.filter((cs) => cs.id !== proposalId));

		// Close any open diff view and selected change set
		setDiffViewChangeSet(null);
		setSelectedChangeSet(null);
	};

	// Add event listener for rejecting proposals
	useEffect(() => {
		const handleRejectProposal = (
			event: CustomEvent<{ proposalId: string }>,
		) => {
			if (event.detail.proposalId) {
				rejectProposal(event.detail.proposalId);
			}
		};

		// Add event listener
		document.addEventListener(
			"rejectProposal",
			handleRejectProposal as EventListener,
		);

		// Clean up
		return () => {
			document.removeEventListener(
				"rejectProposal",
				handleRejectProposal as EventListener,
			);
		};
	}, []);

	// Function to undo a change set
	const undoChangeSet = (changeSetId: string) => {
		// Find the change set
		const changeSet = changeSets.find((cs) => cs.id === changeSetId);
		if (!changeSet) return;

		// Create a new change set that undoes the changes
		const now = new Date();
		const timestamp = formatTimestamp(now);
		const id = `cs-undo-${Date.now()}`;

		// Create undo changes based on the original changes
		const undoChanges: Change[] = changeSet.changes.map((change) => {
			const type =
				change.type === "addition"
					? "deletion"
					: change.type === "deletion"
						? "addition"
						: "modification";

			return {
				id: `change-undo-${Date.now()}-${change.id}`,
				type,
				description: `Undoing: ${change.description}`,
			};
		});

		// Create the new change set
		const newChangeSet: ChangeSetData = {
			id,
			title: `Undo: ${changeSet.title}`,
			subtitle: timestamp,
			timestamp,
			author: currentUser,
			type: "checkpoint",
			label: "Undo",
			labelColor: "bg-yellow-100 text-yellow-800",
			version: activeVersion,
			parentId: changeSet.id,
			comments: [
				{
					id: `comment-${Date.now()}`,
					text: `Undoing changes from "${changeSet.title}"`,
					author: currentUser,
					timestamp: formatTimestamp(new Date()),
				},
			],
			changes: undoChanges,
		};

		// Add the change set to the list
		setChangeSets((prev) => [newChangeSet, ...prev]);

		// Update the version current
		setVersionCurrents((prev) => ({
			...prev,
			[activeVersion]: id,
		}));

		// Show a notification or feedback (could be implemented later)

		// Close any open diff view and selected change set
		setDiffViewChangeSet(null);
		setSelectedChangeSet(null);
	};

	// Function to restore to a specific change set
	const restoreChangeSet = (changeSetId: string) => {
		// Find the change set
		const changeSet = changeSets.find((cs) => cs.id === changeSetId);
		if (!changeSet) return;

		// Create a new change set that restores to the selected change set
		const now = new Date();
		const timestamp = formatTimestamp(now);
		const id = `cs-restore-${Date.now()}`;

		// Create the new change set
		const newChangeSet: ChangeSetData = {
			id,
			title: `Restore to: ${changeSet.title}`,
			subtitle: timestamp,
			timestamp,
			author: currentUser,
			type: "checkpoint",
			label: "Restore",
			labelColor: "bg-blue-100 text-blue-800",
			version: activeVersion,
			parentId: changeSet.id,
			comments: [
				{
					id: `comment-${Date.now()}`,
					text: `Restored to "${changeSet.title}"`,
					author: currentUser,
					timestamp: formatTimestamp(new Date()),
				},
			],
			changes: [
				{
					id: `change-restore-${Date.now()}`,
					type: "modification",
					description: `Restored document to state at "${changeSet.title}"`,
				},
			],
		};

		// Add the change set to the list
		setChangeSets((prev) => [newChangeSet, ...prev]);

		// Update the version current
		setVersionCurrents((prev) => ({
			...prev,
			[activeVersion]: id,
		}));

		// Close any open diff view and selected change set
		setDiffViewChangeSet(null);
		setSelectedChangeSet(null);
	};

	// Function to submit a proposal, switch to main version, and delete the current version
	const submitProposal = (proposalId: string) => {
		if (!proposalChangeSet) return;

		// Create a new proposal in the main version based on the current proposal
		const now = new Date();
		const timestamp = formatTimestamp(now);
		const id = `proposal-submitted-${Date.now()}`;

		// Create a new proposal in the main version
		const newProposal: ChangeSetData = {
			id,
			title: proposalChangeSet.title || "Proposed changes",
			subtitle: timestamp,
			timestamp,
			author: currentUser,
			type: "proposal",
			version: "main", // Associate with main version
			comments: proposalChangeSet.comments,
			changes: proposalChangeSet.changes,
		};

		// Store the source version before clearing the proposal
		const sourceVersion = activeVersion;

		// Add the proposal to the changeSets list
		setChangeSets((prev) => [newProposal, ...prev]);

		// Clear the current proposal
		setProposalChangeSet(null);

		// Close any open diff view
		setDiffViewChangeSet(null);

		// Return to the main version (this will be handled by the ProseMirrorEditor component)
		// We'll emit an event that the parent component can listen for
		setTimeout(() => {
			const event = new CustomEvent("switchToMainVersion", {
				detail: { fromVersion: sourceVersion },
			});
			document.dispatchEvent(event);
		}, 0);
	};

	// Helper function to format timestamps
	const formatTimestamp = (date: Date): string => {
		const hours = date.getHours();
		const minutes = date.getMinutes();
		const formattedTime = `${hours}:${minutes < 10 ? "0" + minutes : minutes}`;

		const now = new Date();
		const isToday =
			date.getDate() === now.getDate() &&
			date.getMonth() === now.getMonth() &&
			date.getFullYear() === now.getFullYear();

		const isYesterday =
			date.getDate() === now.getDate() - 1 &&
			date.getMonth() === now.getMonth() &&
			date.getFullYear() === now.getFullYear();

		if (isToday) {
			return `Today, ${formattedTime}`;
		} else if (isYesterday) {
			return `Yesterday, ${formattedTime}`;
		} else {
			return `${date.toLocaleDateString()}, ${formattedTime}`;
		}
	};

	// Add submitProposal to the context value
	return (
		<ChangeSetContext.Provider
			value={{
				changeSets,
				selectedChangeSet,
				newComments,
				newlyCreatedChangeSet,
				diffViewChangeSet,
				activeVersion,
				proposalChangeSet,
				hasUnsavedChanges,
				currentVersion,
				latestChangesComments,
				isCreatingNewVersion,
				setIsCreatingNewVersion,
				setNewlyCreatedChangeSet,
				setSelectedChangeSet,
				setDiffViewChangeSet,
				handleChangeSetClick,
				handleCommentChange,
				addComment,
				addLatestChangesComment,
				createChangeSet,
				acceptProposal,
				rejectProposal,
				createProposalDiff,
				setHasUnsavedChanges,
				undoChangeSet,
				restoreChangeSet,
				submitProposal,
			}}
		>
			{children}
		</ChangeSetContext.Provider>
	);
}

export function useChangeSets() {
	const context = useContext(ChangeSetContext);
	if (context === undefined) {
		throw new Error("useChangeSets must be used within a ChangeSetProvider");
	}
	return context;
}
