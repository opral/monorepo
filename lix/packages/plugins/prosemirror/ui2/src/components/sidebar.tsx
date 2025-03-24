import { useState, useEffect, useCallback } from "react";
import { CheckpointList } from "./checkpoint-list";
import { ProposalList } from "./proposal-list";
import { useChangeSets } from "./change-set-context";
import { GitPullRequest, Check } from "lucide-react";
import { Button } from "./ui/button";
import { ChangeSet } from "./change-set";

type TabType = "proposals" | "changeSets" | "propose";

export function Sidebar() {
	const [activeTab, setActiveTab] = useState<TabType>("changeSets");
	const {
		setDiffViewChangeSet,
		setSelectedChangeSet,
		activeVersion,
		createProposalDiff,
		proposalChangeSet,
		diffViewChangeSet,
		submitProposal,
		isCreatingNewVersion,
	} = useChangeSets();

	// Determine if we're on main version
	const isMainVersion = activeVersion === "main";

	// When proposalChangeSet changes, switch to the propose tab
	useEffect(() => {
		if (proposalChangeSet && !activeVersion.startsWith("main")) {
			setActiveTab("propose");
		}
	}, [proposalChangeSet, activeVersion]);

	// Set changeSets as the default tab only on main version
	useEffect(() => {
		if (isMainVersion) {
			setActiveTab("changeSets");
		} else {
			// Only set the tab without automatically creating a proposal
			setActiveTab("propose");
		}
	}, [isMainVersion]); // Only depend on isMainVersion

	// Add a separate effect to handle the initial proposal creation
	// This will only run once when the component mounts or when activeVersion changes
	useEffect(() => {
		if (!isMainVersion && !proposalChangeSet && !isCreatingNewVersion) {
			// Only create a proposal if one doesn't exist yet and we're not creating a new version
			// Add a delay to ensure the editor gets focus first
			setTimeout(() => {
				createProposalDiff();

				// Make sure diff view is closed when creating a proposal
				setDiffViewChangeSet(null);
			}, 200);
		}
	}, [
		isMainVersion,
		activeVersion,
		proposalChangeSet,
		createProposalDiff,
		setDiffViewChangeSet,
		isCreatingNewVersion,
	]);

	const switchTab = useCallback(
		(tab: TabType) => {
			// Only perform actions if we're actually switching tabs
			if (activeTab !== tab) {
				// Close any open diff view when switching tabs
				setDiffViewChangeSet(null);

				// Collapse all open change sets
				setSelectedChangeSet(null);

				// Switch the tab
				setActiveTab(tab);
			}
		},
		[activeTab, setDiffViewChangeSet, setSelectedChangeSet],
	);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && activeTab === "propose") {
				// Switch to change sets tab when Escape is pressed in propose tab
				switchTab("changeSets");
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [activeTab, switchTab]);

	// Handle propose action
	const handleProposeClick = () => {
		// Create a proposal diff with a delay to ensure editor gets focus first
		setTimeout(() => {
			createProposalDiff();

			// Ensure diff view is closed
			setDiffViewChangeSet(null);
		}, 200);

		// Switch to propose tab
		setActiveTab("propose");
	};

	// Handle submit proposal action
	const handleSubmitProposal = () => {
		if (proposalChangeSet) {
			submitProposal(proposalChangeSet.id);
		}
	};

	return (
		<div className="flex flex-col h-full">
			<div className="flex border-b">
				{isMainVersion ? (
					// On main version, show both tabs
					<>
						<div
							className={`flex-1 px-3 py-2 text-center text-sm cursor-pointer hover:bg-gray-100 ${activeTab === "changeSets" ? "font-medium border-b border-black" : ""}`}
							onClick={() => switchTab("changeSets")}
						>
							Checkpoints
						</div>
						<div
							className={`flex-1 px-3 py-2 text-center text-sm cursor-pointer hover:bg-gray-100 ${activeTab === "proposals" ? "font-medium border-b border-black" : ""}`}
							onClick={() => switchTab("proposals")}
						>
							Proposals
						</div>
					</>
				) : (
					// On other versions, only show the Propose tab
					<div
						className="flex-1 px-3 py-2 text-center text-sm cursor-pointer hover:bg-gray-100 flex items-center justify-center font-medium border-b border-black"
						onClick={handleProposeClick}
					>
						<GitPullRequest className="h-4 w-4 mr-1" />
						Propose
					</div>
				)}
			</div>

			<div className="flex-1 overflow-auto">
				{activeTab === "changeSets" && isMainVersion ? (
					<CheckpointList />
				) : activeTab === "proposals" && isMainVersion ? (
					<ProposalList />
				) : !isMainVersion && proposalChangeSet ? (
					<div className="flex flex-col h-full">
						<ChangeSet
							key={proposalChangeSet.id}
							id={proposalChangeSet.id}
							title={proposalChangeSet.title}
							subtitle={proposalChangeSet.subtitle}
							timestamp={proposalChangeSet.timestamp}
							author={proposalChangeSet.author}
							isSelected={true}
							onClick={() => {}} // No-op since it's always selected
							comments={proposalChangeSet.comments}
							changes={proposalChangeSet.changes}
							type={proposalChangeSet.type}
							diffViewChangeSet={diffViewChangeSet}
							hideUndoRestore={true} // Hide undo and restore buttons
							customActions={
								<Button
									size="sm"
									className="border rounded-sm px-3 py-1 text-xs flex items-center gap-1"
									onClick={handleSubmitProposal}
								>
									<Check className="h-3 w-3 mr-1" />
									Submit Proposal
								</Button>
							}
						/>
					</div>
				) : (
					<div className="p-4 text-center text-sm text-gray-500">
						Click "Propose" to create a proposal for your changes
					</div>
				)}
			</div>
		</div>
	);
}
