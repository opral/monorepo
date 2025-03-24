import React from "react";
import { useQuery } from "../hooks/useQuery";
import { selectOpenChangeProposals } from "../queries";
import ProposalItem from "./ProposalItem";
import { FileText } from "lucide-react";
import { useKeyValue } from "../hooks/useKeyValue";

interface ProposalListProps {
	onCreateProposal?: () => void;
	onAcceptProposal?: (id: string) => void;
	onRejectProposal?: (id: string) => void;
	onViewDiff?: (proposalId: string) => void;
}

/**
 * ProposalList component
 * Displays a list of proposals with create/view functionality
 */
const ProposalList: React.FC<ProposalListProps> = ({
	onCreateProposal,
	onAcceptProposal,
	onRejectProposal,
	onViewDiff,
}) => {
	// Get all open proposals
	const [proposals] = useQuery(selectOpenChangeProposals);

	// Track which proposal is expanded
	const [expandedProposalId, setExpandedProposalId] = useKeyValue<
		string | null
	>("proposals.expandedProposalId");

	// Event handlers
	const handleExpand = (id: string) => {
		setExpandedProposalId(expandedProposalId === id ? null : id);
	};

	const handleAccept = (id: string) => {
		if (onAcceptProposal) {
			onAcceptProposal(id);
		} else {
			console.log("Accepting proposal:", id);
		}
	};

	const handleReject = (id: string) => {
		if (onRejectProposal) {
			onRejectProposal(id);
		} else {
			console.log("Rejecting proposal:", id);
		}
	};

	const handleViewDiff = () => {
		if (expandedProposalId && onViewDiff) {
			onViewDiff(expandedProposalId);
		}
	};

	return (
		<div className="proposal-list flex flex-col h-full p-4">
			{/* Proposal list or empty state */}
			<div className="overflow-y-auto flex-1">
				{(proposals?.length ?? 0) > 0 ? (
					<div className="space-y-2">
						{proposals?.map((proposal) => (
							<ProposalItem
								key={proposal.id}
								proposal={{
									id: proposal.id,
									account_name: proposal.account_name,
									change_set_id: proposal.source_change_set_id,
									source_change_set_id: proposal.source_change_set_id,
									target_change_set_id: proposal.target_change_set_id,
								}}
								isExpanded={expandedProposalId === proposal.id}
								onExpand={handleExpand}
								onAccept={handleAccept}
								onReject={handleReject}
								onViewDiff={handleViewDiff}
							/>
						))}
					</div>
				) : (
					<div className="flex flex-col items-center justify-center h-full text-center p-6 text-base-content/70">
						<FileText size={48} className="mb-4 opacity-50" />
						<p className="mb-2">No open proposals available.</p>
						<p className="text-sm mb-4">
							Create a new version and propose your changes.
						</p>
						{onCreateProposal && (
							<button
								className="btn btn-outline btn-sm"
								onClick={onCreateProposal}
							>
								Create Proposal
							</button>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default ProposalList;