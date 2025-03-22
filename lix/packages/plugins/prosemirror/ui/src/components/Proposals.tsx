import React, { useState } from "react";
import { useQuery } from "../hooks/useQuery";
import {
	selectOpenChangeProposals,
	selectDiscussionOfProposal,
} from "../queries";
import { createComment, createDiscussion } from "@lix-js/sdk";
import { lix } from "../state";

const Proposals: React.FC = () => {
	const [proposals] = useQuery(selectOpenChangeProposals);

	return (
		<>
			<div
				style={{
					padding: "5px 0",
					display: "flex",
					flexDirection: "column",
					height: "calc(100% - 10px)",
				}}
			>
				<div
					className="proposals-list"
					style={{
						padding: "0 20px",
						flex: 1,
						overflowY: "auto",
					}}
				>
					{(proposals?.length ?? 0) > 0 ? (
						proposals?.map((proposal) => (
							<ProposalItem key={proposal.id} proposal={proposal} />
						))
					) : (
						<div
							style={{ padding: "20px", textAlign: "center", color: "#666" }}
						>
							<p>No open proposals available.</p>
							<p style={{ fontSize: "0.9em", marginTop: "10px" }}>
								Create a new version and click "Propose" to create a change
								proposal.
							</p>
						</div>
					)}
				</div>
			</div>
		</>
	);
};

const ProposalItem = (props: {
	proposal: Awaited<ReturnType<typeof selectOpenChangeProposals>>[number];
}) => {
	const [comment, setComment] = useState("");
	const [discussion] = useQuery(() =>
		selectDiscussionOfProposal(props.proposal),
	);

	const handleAddComment = async () => {
		if (!comment.trim()) return;

		// If there's no discussion or there was an error loading, always create a new discussion
		if (!discussion) {
			await createDiscussion({
				lix,
				changeSet: {
					id: props.proposal.change_set_id,
				},
				firstComment: {
					content: comment,
				},
			});
		} else {
			console.log("Adding comment to existing discussion");
			const lastComment = discussion.comments[discussion.comments.length - 1];

			if (!lastComment) {
				throw new Error("No existing comments found");
			}

			await createComment({
				lix,
				parentComment: lastComment,
				content: comment,
			});
		}

		// Clear the input field
		setComment("");
	};

	const handleAccept = () => {
		console.log("Accepting proposal:", props.proposal.id);
		// Mock accepting the proposal
	};

	const handleReject = () => {
		console.log("Rejecting proposal:", props.proposal.id);
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
			<div
				style={{
					display: "flex",
					alignItems: "center",
					marginBottom: "10px",
				}}
			>
				{/* Avatar icon - simple geometric shape (square) */}
				<div
					style={{
						width: "30px",
						height: "30px",
						borderRadius: "0", // No rounded corners as per user preference
						backgroundColor: "#f0f0f0",
						border: "1px solid #ddd",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						marginRight: "10px",
					}}
				>
					S
				</div>
				<div>
					<div style={{ fontWeight: "bold" }}>
						{props.proposal.account_name}
					</div>
					<div style={{ fontSize: "0.8em", color: "#666" }}>
						Proposal {props.proposal.id.substring(0, 8)}
					</div>
				</div>
			</div>

			{/* Discussion area */}
			<div
				style={{
					marginTop: "5px",
					marginBottom: "10px",
					maxHeight: "120px",
					overflowY: "auto",
					border: "1px solid #ddd",
					padding: "5px",
				}}
			>
				{!discussion ||
				!discussion.comments ||
				discussion.comments.length === 0 ? (
					// No comments message
					<div style={{ textAlign: "center", padding: "10px", color: "#666" }}>
						No comments yet. Be the first to comment!
					</div>
				) : (
					// Display comments if they exist
					discussion.comments?.map((comment) => (
						<div
							key={comment.id}
							style={{
								marginBottom: "5px",
								padding: "3px",
							}}
						>
							<div
								style={{
									display: "flex",
									alignItems: "center",
								}}
							>
								<div
									style={{
										fontWeight: "bold",
										marginRight: "5px",
									}}
								>
									{comment.author_name}
								</div>
								<div style={{ fontSize: "0.8em", color: "#999" }}>
									{new Date(comment.created_at).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</div>
							</div>
							<div
								style={{
									marginLeft: "5px",
									wordBreak: "break-word",
								}}
							>
								{comment.content}
							</div>
						</div>
					))
				)}
			</div>

			{/* Add comment input */}
			<div
				style={{
					display: "flex",
					marginBottom: "15px",
				}}
			>
				<input
					type="text"
					value={comment}
					onChange={(e) => setComment(e.target.value)}
					placeholder="Add a comment..."
					style={{
						flex: 1,
						padding: "8px",
						border: "1px solid #ddd",
						borderRadius: "0", // No rounded corners as per user preference
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter") handleAddComment();
					}}
				/>
			</div>

			{/* Accept/Reject buttons */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
				}}
			>
				<button
					onClick={handleAccept}
					style={{
						border: "1px solid #ddd",
						borderRadius: "0", // No rounded corners as per user preference
						padding: "4px 12px",
						cursor: "pointer",
						marginRight: "8px",
						fontSize: "0.9em",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flex: "1",
						background: "none", // Simple wireframe style
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
						borderRadius: "0", // No rounded corners as per user preference
						padding: "4px 12px",
						cursor: "pointer",
						fontSize: "0.9em",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flex: "1",
						background: "none", // Simple wireframe style
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
