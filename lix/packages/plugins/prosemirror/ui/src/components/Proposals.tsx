import React, { useState } from "react";
import { useQuery } from "../hooks/useQuery";
import { selectOpenChangeProposals } from "../queries";

const Proposals: React.FC = () => {
	const [proposals] = useQuery(selectOpenChangeProposals);
	
	return (
		<>
			<div
				style={{
					padding: "5px 0",
					display: "flex",
					flexDirection: "column",
					height: "calc(100% - 10px)"
				}}
			>
				<div className="proposals-list" style={{ 
					padding: "0 20px",
					flex: 1,
					overflowY: "auto"
				}}>
					{(proposals?.length ?? 0) > 0 ? (
						proposals?.map((proposal) => (
							<ProposalItem key={proposal.id} proposal={proposal} />
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
		</>
	);
};

interface ProposalItemProps {
	proposal: {
		id: string;
		change_set_id: string;
		source_change_set_id: string;
		target_change_set_id: string;
	};
}

const ProposalItem: React.FC<ProposalItemProps> = ({ proposal }) => {
	const [comment, setComment] = useState("");
	// Mock comments for the wireframe
	const [comments, setComments] = useState([
		{ id: "1", author: "User", text: "I made some changes to the document", time: "10:30 AM" },
		{ id: "2", author: "Jane", text: "These changes look good to me", time: "11:45 AM" },
	]);

	const handleAddComment = () => {
		if (!comment.trim()) return;
		
		console.log("Adding comment to proposal:", proposal.id, comment);
		// Mock adding comment
		const newComment = {
			id: Date.now().toString(),
			author: "You",
			text: comment,
			time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
		};
		setComments([...comments, newComment]);
		setComment("");
	};

	const handleAccept = () => {
		console.log("Accepting proposal:", proposal.id);
		// Mock accepting the proposal
	};

	const handleReject = () => {
		console.log("Rejecting proposal:", proposal.id);
		// Mock rejecting the proposal
	};

	return (
		<div 
			style={{
				padding: "8px",
				borderBottom: "1px solid #eee",
				marginBottom: "5px",
			}}
		>
			<div style={{ 
				display: "flex", 
				alignItems: "center", 
				marginBottom: "10px" 
			}}>
				{/* Avatar icon - simple wireframe circle */}
				<div style={{ 
					width: "30px", 
					height: "30px", 
					borderRadius: "50%", 
					backgroundColor: "#f0f0f0", 
					border: "1px solid #ddd",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					marginRight: "10px"
				}}>
					U
				</div>
				<div>
					<div style={{ fontWeight: "bold" }}>
						Author
					</div>
					<div style={{ fontSize: "0.8em", color: "#666" }}>
						Proposal {proposal.id.substring(0, 8)}
					</div>
				</div>
			</div>

			{/* Discussion area */}
			<div style={{ 
				marginTop: "5px",
				marginBottom: "10px",
				maxHeight: "120px",
				overflowY: "auto",
				border: "1px solid #ddd",
				padding: "5px"
			}}>
				{comments.map((comment) => (
					<div 
						key={comment.id}
						style={{ 
							marginBottom: "5px", 
							padding: "3px",
						}}
					>
						<div style={{ 
							display: "flex", 
							alignItems: "center"
						}}>
							<div style={{ 
								fontWeight: "bold", 
								marginRight: "5px" 
							}}>
								{comment.author}:
							</div>
							<div style={{ fontSize: "0.8em", color: "#999" }}>
								{comment.time}
							</div>
						</div>
						<div style={{ 
							marginLeft: "5px",
							wordBreak: "break-word" 
						}}>
							{comment.text}
						</div>
					</div>
				))}
			</div>

			{/* Add comment input */}
			<div style={{ 
				display: "flex", 
				marginBottom: "15px" 
			}}>
				<input
					type="text"
					value={comment}
					onChange={(e) => setComment(e.target.value)}
					placeholder="Add a comment..."
					style={{ 
						flex: 1, 
						padding: "8px", 
						border: "1px solid #ddd",
						borderRadius: "4px"
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter") handleAddComment();
					}}
				/>
			</div>

			{/* Accept/Reject buttons */}
			<div style={{ 
				display: "flex", 
				justifyContent: "space-between" 
			}}>
				<button
					onClick={handleAccept}
					style={{ 
						border: "1px solid #ddd",
						borderRadius: "4px",
						padding: "4px 12px",
						cursor: "pointer",
						marginRight: "8px",
						fontSize: "0.9em",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flex: "1"
					}}
				>
					<svg 
						width="14" 
						height="14" 
						viewBox="0 0 24 24" 
						style={{ marginRight: "5px" }}
					>
						<path
							fill="currentColor"
							d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
						/>
					</svg>
					Accept
				</button>
				<button
					onClick={handleReject}
					style={{ 
						border: "1px solid #ddd",
						borderRadius: "4px",
						padding: "4px 12px",
						cursor: "pointer",
						fontSize: "0.9em",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flex: "1"
					}}
				>
					<svg 
						width="14" 
						height="14" 
						viewBox="0 0 24 24" 
						style={{ marginRight: "5px" }}
					>
						<path
							fill="currentColor"
							d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
						/>
					</svg>
					Reject
				</button>
			</div>
		</div>
	);
};

export default Proposals;
