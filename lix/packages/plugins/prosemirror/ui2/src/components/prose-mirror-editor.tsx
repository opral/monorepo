import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Sidebar } from "./sidebar";
import { UserAccountDropdown } from "./user-account-dropdown";
import { Plus } from "lucide-react";
import { ChangeSetProvider, useChangeSets } from "./change-set-context";
import { UserProvider, useUser } from "./user-context";
import { DiffView } from "./diff-view";

type Version = "main" | string;

interface VersionContent {
	name: string;
	content: string;
	author?: string;
}

// Create a separate EditorContent component
function EditorContent({
	activeVersion,
	setActiveVersion,
}: {
	activeVersion: Version;
	setActiveVersion: (version: Version) => void;
}) {
	const {
		selectedChangeSet,
		changeSets,
		diffViewChangeSet,
		setDiffViewChangeSet,
		proposalChangeSet,
		setHasUnsavedChanges,
		isCreatingNewVersion,
		setIsCreatingNewVersion,
	} = useChangeSets();
	const { currentUser } = useUser();
	const [versions, setVersions] = useState<Record<string, VersionContent>>({
		main: {
			name: "Main",
			content:
				"hello, world\n\nThis is the main branch content. It contains the original text without any modifications.",
		},
	});
	const editorRef = useRef<HTMLDivElement>(null);
	const [isFocused, setIsFocused] = useState(false);
	const [lastSavedContent, setLastSavedContent] = useState<
		Record<string, string>
	>({
		main: versions.main.content,
	});
	// Keep track of versions to be deleted after switching
	const [versionToDelete, setVersionToDelete] = useState<string | null>(null);

	// Find the currently selected change set - either from regular change sets or the proposal change set
	const currentChangeSet =
		proposalChangeSet && diffViewChangeSet === proposalChangeSet.id
			? proposalChangeSet
			: changeSets.find((cs) => cs.id === diffViewChangeSet);

	// Check if the diff view is for latest changes
	const isLatestChangesDiff = diffViewChangeSet?.startsWith("latest-changes");

	// Determine if we should show diff view
	const showingDiff =
		!!diffViewChangeSet && (!!currentChangeSet || isLatestChangesDiff);

	// Update editor content when active version changes
	useEffect(() => {
		// Make sure the version exists before trying to access its content
		if (editorRef.current && versions[activeVersion] && !showingDiff) {
			editorRef.current.innerText = versions[activeVersion].content;
		}

		// Initialize lastSavedContent for this version if it doesn't exist
		if (versions[activeVersion] && !lastSavedContent[activeVersion]) {
			setLastSavedContent((prev) => ({
				...prev,
				[activeVersion]: versions[activeVersion]?.content || "",
			}));
		}

		// If we've switched to main and there's a version to delete, delete it now
		if (
			activeVersion === "main" &&
			versionToDelete &&
			versionToDelete !== "main"
		) {
			setVersions((prev) => {
				const newVersions = { ...prev };
				delete newVersions[versionToDelete];
				return newVersions;
			});

			// Also remove from lastSavedContent
			setLastSavedContent((prev) => {
				const newLastSaved = { ...prev };
				delete newLastSaved[versionToDelete];
				return newLastSaved;
			});

			// Clear the version to delete
			setVersionToDelete(null);
		}
	}, [activeVersion, versions, showingDiff, lastSavedContent, versionToDelete]);

	// If active version doesn't exist, switch to main
	useEffect(() => {
		if (activeVersion !== "main" && !versions[activeVersion]) {
			console.warn(`Version ${activeVersion} not found, switching to main`);
			setActiveVersion("main");
		}
	}, [activeVersion, versions, setActiveVersion]);

	const switchVersion = (version: Version) => {
		// Make sure the version exists before switching
		if (!versions[version]) {
			console.warn(`Cannot switch to version ${version} as it doesn't exist`);
			return;
		}

		// Save current content before switching
		if (editorRef.current && !showingDiff && versions[activeVersion]) {
			updateVersionContent(activeVersion, editorRef.current.innerText);
		}
		setActiveVersion(version);
	};

	const updateVersionContent = (versionId: string, newContent: string) => {
		// Make sure the version exists before updating
		if (!versions[versionId]) {
			console.warn(
				`Cannot update content for version ${versionId} as it doesn't exist`,
			);
			return;
		}

		setVersions((prev) => ({
			...prev,
			[versionId]: {
				...prev[versionId],
				content: newContent,
			},
		}));

		// Check if content has changed from last saved version
		const hasChanged = newContent !== lastSavedContent[versionId];
		setHasUnsavedChanges(versionId, hasChanged);
	};

	const handleEditorInput = () => {
		if (editorRef.current && !showingDiff && versions[activeVersion]) {
			const newContent = editorRef.current.innerText;
			updateVersionContent(activeVersion, newContent);
		}
	};

	const createNewVersion = () => {
		// Signal that we're creating a new version to prevent auto-focus in the sidebar
		setIsCreatingNewVersion(true);

		// Get the first name of the current user
		const firstName = currentUser.name.split(" ")[0];

		// Generate a unique ID for the new version
		const newVersionId = `version-${Date.now()}`;

		// Create a new version based on the main content
		const newVersion: VersionContent = {
			name: `${firstName}'s Version`,
			content: versions.main.content,
			author: currentUser.name,
		};

		// Add the new version to the versions object
		setVersions((prev) => ({
			...prev,
			[newVersionId]: newVersion,
		}));

		// Initialize lastSavedContent for the new version
		setLastSavedContent((prev) => ({
			...prev,
			[newVersionId]: newVersion.content,
		}));

		// Copy all checkpoints from main to the new version
		const mainCheckpoints = changeSets.filter(
			(cs) => cs.version === "main" && cs.type === "checkpoint",
		);

		if (mainCheckpoints.length > 0) {
			// Create copies of the checkpoints for the new version
			const newCheckpoints = mainCheckpoints.map((checkpoint) => ({
				...checkpoint,
				id: `cs-${Date.now()}-${checkpoint.id}`,
				version: newVersionId,
				// Keep the same parent-child relationships
				parentId: checkpoint.parentId
					? `cs-${Date.now()}-${checkpoint.parentId}`
					: undefined,
			}));

			// Add the new checkpoints to the changeSets
			newCheckpoints.forEach((checkpoint) => {
				// We'll use the ChangeSetContext to add these checkpoints
				// This is a simplified version - in a real app, you'd need to handle this more carefully
				// For now, we'll just add them to the changeSets array
				changeSets.push(checkpoint);
			});
		}

		// Switch to the new version
		setActiveVersion(newVersionId);

		// Focus the editor after a short delay to ensure the DOM has updated
		setTimeout(() => {
			if (editorRef.current) {
				editorRef.current.focus();

				// Place cursor at the end of the content
				const range = document.createRange();
				const selection = window.getSelection();

				if (editorRef.current.childNodes.length > 0) {
					const lastNode =
						editorRef.current.childNodes[
							editorRef.current.childNodes.length - 1
						];
					range.setStartAfter(lastNode);
				} else {
					range.setStart(editorRef.current, 0);
				}

				range.collapse(true);

				if (selection) {
					selection.removeAllRanges();
					selection.addRange(range);
				}
			}

			// Reset the flag after a delay to allow for future auto-focus
			setTimeout(() => {
				setIsCreatingNewVersion(false);
			}, 500);
		}, 100);
	};

	// Add event listener for switching to main version
	useEffect(() => {
		const handleSwitchToMain = (
			event: CustomEvent<{ fromVersion: string }>,
		) => {
			// Save current content before switching if the current version exists
			if (editorRef.current && !showingDiff && versions[activeVersion]) {
				try {
					updateVersionContent(activeVersion, editorRef.current.innerText);
				} catch (error) {
					console.error("Error saving content before switching:", error);
				}
			}

			// Mark the version for deletion after switching to main
			if (event.detail.fromVersion && event.detail.fromVersion !== "main") {
				setVersionToDelete(event.detail.fromVersion);
			}

			// Switch to main version
			setActiveVersion("main");
		};

		// Add event listener
		document.addEventListener(
			"switchToMainVersion",
			handleSwitchToMain as EventListener,
		);

		// Clean up
		return () => {
			document.removeEventListener(
				"switchToMainVersion",
				handleSwitchToMain as EventListener,
			);
		};
	}, [activeVersion, versions, setActiveVersion, showingDiff]);

	// If showing diff, render the DiffView component
	if (showingDiff) {
		// For latest changes, create a mock change set
		if (isLatestChangesDiff) {
			const latestChangesSet = {
				id: diffViewChangeSet,
				title: "Latest Changes",
				subtitle: "Unsaved changes",
				timestamp: "Just now",
				author: { id: "current", name: "You", initials: "YO" },
				type: "checkpoint" as const,
				comments: [],
				changes: [
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
				],
			};
			return (
				<DiffView
					changeSet={latestChangesSet}
					onClose={() => setDiffViewChangeSet(null)}
				/>
			);
		}

		// Otherwise use the regular change set
		if (currentChangeSet) {
			return (
				<DiffView
					changeSet={currentChangeSet}
					onClose={() => setDiffViewChangeSet(null)}
				/>
			);
		}
	}

	// If the active version doesn't exist, show a message and a button to go back to main
	if (!versions[activeVersion]) {
		return (
			<div className="flex flex-col flex-1 items-center justify-center p-4">
				<div className="text-center mb-4">
					<h3 className="text-lg font-medium">Version not found</h3>
					<p className="text-muted-foreground">
						The version you're trying to access doesn't exist or was deleted.
					</p>
				</div>
				<Button onClick={() => setActiveVersion("main")}>
					Go to Main Version
				</Button>
			</div>
		);
	}

	// Otherwise render the regular editor
	return (
		<div className="flex flex-col flex-1">
			<div className="flex border-b h-9 items-center overflow-x-auto">
				<div
					className={`px-3 h-full flex items-center cursor-pointer hover:bg-gray-100 ${activeVersion === "main" ? "border-b-2 border-black" : ""}`}
					onClick={() => switchVersion("main")}
				>
					main
				</div>

				{/* Render version tabs */}
				{Object.entries(versions).map(([id, version]) => {
					if (id === "main") return null; // Skip main as it's already rendered

					return (
						<div
							key={id}
							className={`px-3 h-full flex items-center cursor-pointer hover:bg-gray-100 ${activeVersion === id ? "border-b-2 border-black" : ""}`}
							onClick={() => switchVersion(id)}
						>
							{version.name}
						</div>
					);
				})}

				{/* Action buttons */}
				<div className="ml-auto mr-3">
					{activeVersion === "main" && (
						<Button
							size="sm"
							className="border rounded-sm px-2 py-0.5 flex items-center gap-1 text-xs h-6"
							onClick={createNewVersion}
						>
							<Plus className="h-3 w-3" /> Propose Changes
						</Button>
					)}
				</div>
			</div>
			<div
				ref={editorRef}
				className={`p-3 flex-1 whitespace-pre-line outline-none ${isFocused ? "bg-gray-50" : ""}`}
				contentEditable={true}
				onInput={handleEditorInput}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
				suppressContentEditableWarning={true}
			/>
		</div>
	);
}

// Update the Editor component to pass activeVersion to ChangeSetProvider
export function ProseMirrorEditor() {
	// Add state for active version at the top level
	const [activeVersion, setActiveVersion] = useState<Version>("main");

	return (
		<UserProvider>
			<div className="flex flex-col h-full border rounded-sm overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between border-b p-2">
					<h1 className="text-base">ProseMirror Lix Plugin Demo</h1>
					<UserAccountDropdown />
				</div>

				{/* Main content */}
				<div className="flex flex-1 overflow-hidden">
					{/* Editor area with ChangeSetProvider context */}
					<ChangeSetProvider activeVersion={activeVersion}>
						<div className="flex flex-1">
							<EditorContent
								activeVersion={activeVersion}
								setActiveVersion={setActiveVersion}
							/>

							{/* Sidebar */}
							<div className="flex flex-col w-72 border-l">
								<Sidebar />
							</div>
						</div>
					</ChangeSetProvider>
				</div>
			</div>
		</UserProvider>
	);
}
