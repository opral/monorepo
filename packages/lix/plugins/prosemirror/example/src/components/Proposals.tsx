// @ts-nocheck

import { useQuery } from "../hooks/useQuery";
import { selectOpenChangeProposals } from "../queries";
import { FileText } from "lucide-react";
import { ChangeSet } from "./ChangeSet";
import { lix } from "../state";
import { useKeyValue } from "../hooks/useKeyValue";

/**
 * ProposalList component
 * Displays a list of proposals with create/view functionality
 */
export default function Proposals() {
	// Get all open proposals
	const [proposals] = useQuery(selectOpenChangeProposals);
	const [_, setActiveTab] = useKeyValue("activeTab", {
		versionId: "global",
		untracked: true,
	});

	const handleAccept = async (id: string) => {
		await mergeChangeSet(id);
		await lix.db.deleteFrom("change_proposal").where("id", "=", id).execute();
		setActiveTab("checkpoints");
	};

	const handleReject = async (id: string) => {
		await lix.db.deleteFrom("change_proposal").where("id", "=", id).execute();
		setActiveTab("checkpoints");
	};

	return (
		<div className="proposal-list flex flex-col h-full">
			{/* Proposal list or empty state */}
			<div className="overflow-y-auto flex-1">
				{(proposals?.length ?? 0) > 0 ? (
					<div className="space-y-2">
						{proposals?.map((proposal) => (
							<ChangeSet
								key={proposal.id}
								changeSet={{
									id: proposal.change_set_id,
									change_count: proposal.change_count,
									immutable_elements: false,
								}}
								showRestore={false}
								showUndo={false}
								footer={
									<div className="flex justify-end gap-2">
										<button
											className="btn btn-sm btn-outline"
											onClick={() => handleReject(proposal.id)}
										>
											Reject
										</button>
										<button
											className="btn btn-sm btn-primary"
											onClick={() => handleAccept(proposal.change_set_id)}
										>
											Accept
										</button>
									</div>
								}
							/>
						))}
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
		<div className="flex flex-col items-center justify-center h-full text-base-content-secondary">
			<FileText size={32} className="mb-2" />
			<p>No proposals yet</p>
			<p className="text-sm">Create a new version to propose changes</p>
		</div>
	);
}
