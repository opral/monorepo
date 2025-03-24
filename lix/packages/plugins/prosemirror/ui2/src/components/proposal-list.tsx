import { ChangeSet } from "./change-set";
import { useChangeSets } from "./change-set-context";
import { useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { CheckIcon, XIcon } from "lucide-react";

export function ProposalList() {
	const {
		changeSets,
		selectedChangeSet,
		diffViewChangeSet,
		handleChangeSetClick,
		acceptProposal,
		rejectProposal,
	} = useChangeSets();

	// Filter to only show proposals
	const proposals = changeSets.filter(
		(changeSet) => changeSet.type === "proposal",
	);

	// Add refs for textareas
	const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

	// Focus the textarea when a change set is selected
	useEffect(() => {
		if (selectedChangeSet && textareaRefs.current[selectedChangeSet]) {
			// Small delay to ensure the DOM is fully rendered
			setTimeout(() => {
				textareaRefs.current[selectedChangeSet]?.focus();
			}, 50);
		}
	}, [selectedChangeSet]);

	return (
		<>
			{proposals.length > 0 ? (
				proposals.map((proposal) => (
					<ChangeSet
						key={proposal.id}
						id={proposal.id}
						title={proposal.title}
						subtitle={proposal.subtitle}
						timestamp={proposal.timestamp}
						author={proposal.author}
						isSelected={selectedChangeSet === proposal.id}
						onClick={handleChangeSetClick}
						comments={proposal.comments}
						changes={proposal.changes}
						type={proposal.type}
						diffViewChangeSet={diffViewChangeSet}
						hideUndoRestore={true} // Hide undo and restore buttons for proposals
						customActions={
							<div className="flex gap-2">
								<Button
									size="sm"
									className="border rounded-sm px-3 py-1 text-xs flex items-center gap-1"
									onClick={() => acceptProposal(proposal.id)}
								>
									<CheckIcon className="h-3 w-3 mr-1" />
									Accept
								</Button>
								<Button
									size="sm"
									className="border rounded-sm px-3 py-1 text-xs flex items-center gap-1"
									onClick={() => rejectProposal(proposal.id)}
								>
									<XIcon className="h-3 w-3 mr-1" />
									Reject
								</Button>
							</div>
						}
					/>
				))
			) : (
				<div className="p-4 text-center text-sm text-gray-500">
					No proposals available
				</div>
			)}
		</>
	);
}
