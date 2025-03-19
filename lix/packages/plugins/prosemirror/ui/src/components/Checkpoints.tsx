import React, { useState } from "react";
import { Change, applyChanges } from "@lix-js/sdk";
import { createCheckpoint } from "../utilities/createCheckpoint";
import { toUserTime } from "../utilities/timeUtils";
import { lix, checkpoints as stateCheckpoints, prosemirrorDocument } from "../state";

interface CheckpointsProps {
	changes: Array<Change & { content: any }>;
}

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
const getCheckpointPreview = (
	changes: Array<Change & { content: any }>,
): string => {
	if (!changes || changes.length === 0) return "Empty checkpoint";

	// Get the first change with content
	const changeWithContent = changes.find((c) => c.content);
	if (changeWithContent) {
		return getContentPreview(changeWithContent as ExtendedChange);
	}

	return `Checkpoint with ${changes.length} changes`;
};

const Checkpoints: React.FC<CheckpointsProps> = ({ changes }) => {
	// State for selected checkpoint and message input
	const [selectedCheckpointId, setSelectedCheckpointId] = useState<
		string | null
	>(null);
	const [isCreatingCheckpoint, setIsCreatingCheckpoint] = useState(false);
	const [checkpointMessage, setCheckpointMessage] = useState("");

	// Handler for creating a checkpoint
	const handleCreateCheckpoint = async () => {
		if (isCreatingCheckpoint || changes.length === 0) return;

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

	return (
		<div
			className="checkpoints-container"
			style={{ border: "1px solid #ddd", borderRadius: "4px" }}
		>
			<div
				className="checkpoints-header"
				style={{
					padding: "10px 0" /* Remove left/right padding from container */,
					borderBottom: "1px solid #ddd",
					background: "#f9f9f9",
					display: "flex",
					flexDirection: "column",
				}}
			>
				<h3
					style={{
						margin: "0 0 10px 0",
						textAlign: "left",
						alignSelf: "flex-start",
						width: "100%",
						paddingLeft: "20px",
					}}
				>
					Checkpoints
				</h3>

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
							padding: "5px 10px", // Match the button padding
							marginBottom: "8px",
							border: "1px solid #ddd",
							borderRadius: "4px",
							boxSizing: "border-box",
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleCreateCheckpoint();
						}}
					/>

					<button
						style={{
							padding: "5px 10px",
							background: "#f9f9f9",
							border: "1px solid #ddd",
							borderRadius: "4px",
							cursor:
								isCreatingCheckpoint || changes.length === 0
									? "not-allowed"
									: "pointer",
							opacity: isCreatingCheckpoint || changes.length === 0 ? 0.6 : 1,
							width: "100%",
							marginBottom: "10px",
							boxSizing: "border-box",
						}}
						onClick={handleCreateCheckpoint}
						disabled={isCreatingCheckpoint || changes.length === 0}
					>
						{isCreatingCheckpoint ? "Creating..." : "Create"}
					</button>
				</div>
			</div>

			<div
				className="checkpoints-list"
				style={{ maxHeight: "400px", overflow: "auto" }}
			>
				{stateCheckpoints.length > 0 ? (
					stateCheckpoints.map((checkpoint) => {
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
											changes: checkpoint.changes
										});
										
										console.log(`Applied changes from checkpoint: ${checkpoint.id}`);
										
										// Dispatch a custom event to notify that a checkpoint has been applied
										window.dispatchEvent(new CustomEvent('apply-checkpoint'));
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
