import { useQuery } from "../hooks/useQuery";
import { selectOpenChangeProposals } from "../queries";
import { FileText } from "lucide-react";

/**
 * ProposalList component
 * Displays a list of proposals with create/view functionality
 */
export default function Proposals() {
	// Get all open proposals
	const [proposals] = useQuery(selectOpenChangeProposals);

	const handleAccept = (id: string) => {
		console.log("Accepting proposal:", id);
	};

	const handleReject = (id: string) => {
		console.log("Rejecting proposal:", id);
	};

	return (
		<div className="proposal-list flex flex-col h-full p-4">
			{/* Proposal list or empty state */}
			<div className="overflow-y-auto flex-1">
				{(proposals?.length ?? 0) > 0 ? (
					<div className="space-y-2">
						{proposals?.map((proposal) => <p>todo</p>)}
					</div>
				) : (
					<EmptyState />
				)}
			</div>
		</div>
	);
}

function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center h-full text-center p-6 text-base-content/70">
			<FileText size={48} className="mb-4" />
			<p className="mb-2">No open change proposals.</p>
			<p className="text-sm mb-4">
				Create a new version and propose your changes.
			</p>
		</div>
	);
}
