import React from "react";
import { useQuery } from "../hooks/useQuery";
import { selectOpenChangeProposals } from "../queries";

const Proposals: React.FC = () => {
	const [proposals] = useQuery(selectOpenChangeProposals);

	return (
		<div style={{ padding: "0", height: "100%" }}>
			<div
				className="proposals-list"
				style={{ maxHeight: "400px", overflow: "auto" }}
			>
				{(proposals?.length ?? 0) > 0 ? (
					proposals?.map((proposal) => (
						<div
							key={proposal.id}
							style={{
								padding: "10px",
								borderBottom: "1px solid #eee",
								cursor: "pointer",
							}}
							onClick={() => {
								console.log("Proposal clicked:", proposal);
								// Future functionality: view proposal details or accept proposal
							}}
						>
							<div style={{ fontSize: "0.95em", marginBottom: "5px" }}>
								Proposal {proposal.id.substring(0, 8)}
							</div>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									marginTop: "5px",
								}}
							>
								<button
									style={{
										padding: "3px 8px",
										background: "#f9f9f9",
										border: "1px solid #ddd",
										borderRadius: "4px",
										fontSize: "12px",
										cursor: "pointer",
									}}
									onClick={(e) => {
										e.stopPropagation();
										console.log("View proposal:", proposal);
										// Future functionality: view proposal details
									}}
								>
									View
								</button>
								<button
									style={{
										padding: "3px 8px",
										background: "#f9f9f9",
										border: "1px solid #ddd",
										borderRadius: "4px",
										fontSize: "12px",
										cursor: "pointer",
									}}
									onClick={(e) => {
										e.stopPropagation();
										console.log("Accept proposal:", proposal);
										// Future functionality: accept proposal
									}}
								>
									Accept
								</button>
							</div>
						</div>
					))
				) : (
					<div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
						<p>No open proposals available.</p>
						<p style={{ fontSize: "0.9em", marginTop: "10px" }}>
							Create a new version and click "Propose" to create a change proposal.
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default Proposals;
