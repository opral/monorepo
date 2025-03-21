import React, { useState } from "react";
import { Change, applyChanges } from "@lix-js/sdk";
import { createCheckpoint } from "../utilities/createCheckpoint";
import { toUserTime } from "../utilities/timeUtils";
import { lix } from "../state";
import { useQuery } from "../hooks/useQuery";
import { selectChanges, selectCheckpoints } from "../queries";

// Extend the Change type to include an optional metadata property
interface ExtendedChange extends Change {
	content: any;
	metadata?: string | Record<string, any>;
}

// Get a summary preview from a change or checkpoint
const getContentPreview = (change: ExtendedChange): string => {
	if (!change.content) return "Content deleted";

	if (typeof change.content === "object") {
		// For text nodes, show the text content
		if (change.content.text) {
			return (
				change.content.text.substring(0, 60) +
				(change.content.text.length > 60 ? "..." : "")
			);
		}

		// For paragraph nodes, extract content from their children
		if (change.content.content && Array.isArray(change.content.content)) {
			const textNodes = change.content.content
				.filter((node: any) => node.type === "text" && node.text)
				.map((node: any) => node.text);

			if (textNodes.length > 0) {
				const combinedText = textNodes.join(" ");
				return (
					combinedText.substring(0, 60) +
					(combinedText.length > 60 ? "..." : "")
				);
			}
		}

		// For other node types
		return `${change.content.type || "Unknown"} node`;
	}

	return "Unknown content";
};

// Get a summary preview from a checkpoint
const getCheckpointPreview = (changes: Array<ExtendedChange>): string => {
	if (changes.length === 0) return "No changes";

	const previews = changes.map(getContentPreview);
	return previews.join(", ");
};

const Checkpoints: React.FC = () => {
	const [changes] = useQuery(selectChanges);
	const [stateCheckpoints] = useQuery(selectCheckpoints);

	// State for selected checkpoint and message input
	const [selectedCheckpointId, setSelectedCheckpointId] = useState<
		string | null
	>(null);
	const [isCreatingCheckpoint, setIsCreatingCheckpoint] = useState(false);
	const [checkpointMessage, setCheckpointMessage] = useState("");
	const [activeTab, setActiveTab] = useState("checkpoints");

	// Handler for creating a checkpoint
	const handleCreateCheckpoint = async () => {
		if (isCreatingCheckpoint || !changes || changes.length === 0) return;

		try {
			setIsCreatingCheckpoint(true);

			// Create the checkpoint with optional message
			await createCheckpoint(lix, checkpointMessage);

			// Reset the message input
			setCheckpointMessage("");
		} catch (error) {
			console.error("Failed to create checkpoint:", error);
		} finally {
			setIsCreatingCheckpoint(false);
		}
	};

	// Mock functions for proposals
	const handleProposals = () => {
		console.log("Proposals tab clicked");
	};

	return (
		<div
			className="checkpoints-container"
			style={{ border: "none", borderRadius: "0", margin: 0, padding: 0 }}
		>
			<div
				className="checkpoints-header"
				style={{
					display: "flex",
					borderBottom: "1px solid #e5e7eb",
					height: "40px", // Match the height of the version bar in the Editor
					margin: 0,
					padding: 0,
				}}
			>
				<button
					style={{
						flex: 1,
						padding: "0",
						border: "none",
						outline: "none",
						background: "none",
						cursor: "pointer",
						fontWeight: activeTab === "checkpoints" ? "bold" : "normal",
						fontSize: "14px",
					}}
					onClick={() => setActiveTab("checkpoints")}
				>
					Checkpoints
				</button>
				<div style={{ width: "1px", height: "14px", background: "#e5e7eb" }}></div>
				<button
					style={{
						flex: 1,
						padding: "0",
						border: "none",
						outline: "none",
						background: "none",
						cursor: "pointer",
						fontWeight: activeTab === "proposals" ? "bold" : "normal",
						fontSize: "14px",
					}}
					onClick={() => setActiveTab("proposals")}
				>
					Proposals
				</button>
			</div>

			{activeTab === "checkpoints" && (
				<div
					style={{
						padding: "5px 0",
						display: "flex",
						flexDirection: "column",
					}}
				>
					<div
						style={{
							paddingLeft: "20px",
							paddingRight: "20px",
							width: "100%",
							boxSizing: "border-box",
						}}
					>
						<input
							id="checkpoint-message-input"
							type="text"
							value={checkpointMessage}
							onChange={(e) => setCheckpointMessage(e.target.value)}
							placeholder="Add a message"
							style={{
								width: "100%",
								padding: "4px 8px",
								marginBottom: "5px",
								border: "1px solid #ddd",
								borderRadius: "4px",
								boxSizing: "border-box",
								height: "28px",
								fontSize: "13px",
							}}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleCreateCheckpoint();
							}}
						/>

						<button
							style={{
								padding: "4px 8px",
								background: "#f9f9f9",
								border: "1px solid #ddd",
								borderRadius: "4px",
								cursor:
									isCreatingCheckpoint || !changes || changes.length === 0
										? "not-allowed"
										: "pointer",
								opacity:
									isCreatingCheckpoint || !changes || changes.length === 0
										? 0.6
										: 1,
								width: "100%",
								marginBottom: "5px",
								boxSizing: "border-box",
								height: "28px",
								fontSize: "13px",
							}}
							onClick={handleCreateCheckpoint}
							disabled={isCreatingCheckpoint || !changes || changes.length === 0}
						>
							{isCreatingCheckpoint ? "Creating..." : "Create"}
						</button>
					</div>
				</div>
			)}

			{activeTab === "proposals" && (
				<div
					style={{
						padding: "20px",
						textAlign: "center",
						color: "#666",
					}}
				>
					<p>Proposals content goes here.</p>
				</div>
			)}

			<div
				className="checkpoints-list"
				style={{ maxHeight: "400px", overflow: "auto" }}
			>
				{(stateCheckpoints?.length ?? 0 > 0) ? (
					stateCheckpoints?.map((checkpoint) => {
						const isSelected = checkpoint.id === selectedCheckpointId;

						return (
							<div
								key={checkpoint.id}
								style={{
									padding: "10px",
									borderBottom: "1px solid #eee",
									background: isSelected ? "#f5f5f5" : "white",
									cursor: "pointer",
								}}
								onClick={async () => {
									try {
										setSelectedCheckpointId(checkpoint.id);

										// Apply the changes from this checkpoint
										await applyChanges({
											lix,
											changes: checkpoint.changes,
										});

										console.log(
											`Applied changes from checkpoint: ${checkpoint.id}`,
										);
										
										// The Lix plugin will automatically detect the changes through polling
									} catch (error) {
										console.error("Error applying checkpoint changes:", error);
									}
								}}
							>
								{checkpoint.message ? (
									<div
										style={{
											fontWeight: "bold",
											marginBottom: "5px",
											fontSize: "1em",
										}}
									>
										{checkpoint.message}
									</div>
								) : (
									<div style={{ marginBottom: "5px", fontSize: "0.95em" }}>
										{getCheckpointPreview(checkpoint.changes)}
									</div>
								)}
								<div
									style={{
										fontSize: "0.8em",
										color: "#666",
										marginBottom: "3px",
									}}
								>
									{toUserTime(checkpoint.created_at)}
								</div>
								<div style={{ fontSize: "0.8em", color: "#666" }}>
									{checkpoint.changes.length} changes
								</div>
							</div>
						);
					})
				) : (
					<div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
						<p>
							No checkpoints available. Create your first checkpoint to save a
							version of your document.
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default Checkpoints;
