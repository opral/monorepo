import React, { useState, useEffect } from "react";
import {
	createDiscussion,
	changeIsLeafInVersion,
	changeHasLabel,
} from "@lix-js/sdk";
import { useAtomValue } from "jotai";
import { lixAtom } from "../state";

interface CheckpointSidebarProps {
	currentVersionId: string;
	onRestoreCheckpoint: (checkpointId: string) => void;
}

interface Checkpoint {
	id: string;
	discussion_id: string | null;
	first_comment_content: string | null;
	author_name: string | null; // Changed to allow null values
	checkpoint_created_at: string | null;
}

// Helper function to create a checkpoint
const createCheckpoint = async (
	lix: any,
	versionId: string,
	description: string = "",
) => {
	try {
		console.log("Creating checkpoint for version:", versionId);

		const changeSet = await lix.db.transaction().execute(async (trx) => {
			// create a new set
			const newChangeSet = await trx
				.insertInto("change_set")
				.defaultValues()
				.returning("id")
				.executeTakeFirstOrThrow();

			console.log("Created change set:", newChangeSet);

			// get the id of the checkpoint label
			const checkpointLabel = await trx
				.selectFrom("label")
				.where("name", "=", "checkpoint")
				.select("id")
				.executeTakeFirst();

			// If checkpoint label doesn't exist, create it
			let labelId;
			if (!checkpointLabel) {
				console.log("Checkpoint label not found, creating it");
				const newLabel = await trx
					.insertInto("label")
					.values({
						name: "checkpoint",
					})
					.returning("id")
					.executeTakeFirstOrThrow();
				labelId = newLabel.id;
			} else {
				labelId = checkpointLabel.id;
			}

			console.log("Using label ID:", labelId);

			// tag the set as checkpoint
			await trx
				.insertInto("change_set_label")
				.values({
					change_set_id: newChangeSet.id,
					label_id: labelId,
				})
				.execute();

			// First, get all leaf changes for the current version
			const allLeafChanges = await trx
				.selectFrom("change")
				.innerJoin("file", "change.file_id", "file.id")
				.where("file.path", "=", "/prosemirror.json")
				.where(changeIsLeafInVersion({ id: versionId }))
				.selectAll("change")
				.execute();

			console.log(`Found ${allLeafChanges.length} leaf changes`);

			if (allLeafChanges.length === 0) {
				throw new Error("No leaf changes found to include in checkpoint");
			}

			// Add all leaf changes to the checkpoint
			for (const leafChange of allLeafChanges) {
				try {
					console.log(`Adding leaf change ${leafChange.id} to checkpoint`);
					await trx
						.insertInto("change_set_element")
						.values({
							change_set_id: newChangeSet.id,
							change_id: leafChange.id,
						})
						.onConflict((oc) => oc.doNothing())
						.execute();
				} catch (error) {
					console.error(`Error processing change ${leafChange.id}:`, error);
					// Continue with the next change instead of failing the whole transaction
				}
			}

			return newChangeSet;
		});

		// Create a discussion with the description if provided
		if (description && description.trim() !== "") {
			await createDiscussion({
				lix,
				changeSet,
				firstComment: { content: description },
			});
		}

		// Save to OPFS
		try {
			const { saveLixToOpfs } = await import("../helper/saveLixToOpfs");
			await saveLixToOpfs({ lix });
			console.log("Saved checkpoint to OPFS");
		} catch (e) {
			console.error("Failed to save to OPFS:", e);
		}

		console.log("Checkpoint created successfully:", changeSet);
		return changeSet;
	} catch (error) {
		console.error("Error in createCheckpoint:", error);
		throw error;
	}
};

const CheckpointSidebar: React.FC<CheckpointSidebarProps> = ({
	currentVersionId,
	onRestoreCheckpoint,
}) => {
	const lix = useAtomValue(lixAtom);
	const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
	const [intermediateChangeIds, setIntermediateChangeIds] = useState<
		{ id: string }[]
	>([]);
	const [description, setDescription] = useState("");
	const [loading, setLoading] = useState(true);
	const [isCreatingCheckpoint, setIsCreatingCheckpoint] = useState(false);

	// Fetch checkpoints and intermediate changes
	const fetchData = async () => {
		if (!currentVersionId) {
			console.log("No current version ID, skipping fetch");
			return;
		}

		try {
			// Fetch checkpoints
			const checkpointData = await lix.db
				.selectFrom("change_set")
				.leftJoin(
					"change_set_element",
					"change_set_element.change_set_id",
					"change_set.id",
				)
				.leftJoin("change", "change.id", "change_set_element.change_id")
				.leftJoin("change as own_change", (join) =>
					join
						.onRef("own_change.entity_id", "=", "change_set.id")
						.on("own_change.schema_key", "=", "lix_change_set_table"),
				)
				.leftJoin("change_author", "own_change.id", "change_author.change_id")
				.leftJoin("account", "change_author.account_id", "account.id")
				.leftJoin("discussion", "discussion.change_set_id", "change_set.id")
				.leftJoin("comment", "comment.discussion_id", "discussion.id")
				.where("comment.parent_id", "is", null) // Filter to get only the first comment
				.where(changeHasLabel("checkpoint"))
				.leftJoin("file", "change.file_id", "file.id")
				.where((eb) =>
					eb.or([
						eb("file.path", "=", "/prosemirror.json"),
						eb("file.path", "is", null),
					]),
				)
				.groupBy("change_set.id")
				.orderBy(
					(eb) =>
						eb
							.case()
							.when("own_change.created_at", "is not", null)
							.then("own_change.created_at")
							.else("change_set.id")
							.end(),
					"desc",
				)
				.select("change_set.id")
				.select("discussion.id as discussion_id")
				.select("comment.content as first_comment_content")
				.select("account.name as author_name")
				.select("own_change.created_at as checkpoint_created_at")
				.execute();

			console.log("Fetched checkpoints:", checkpointData);
			setCheckpoints(checkpointData);

			// Fetch intermediate changes (changes not in a checkpoint)
			try {
				const intermediateChangeIdsData = await lix.db
					.selectFrom("change")
					.innerJoin("file", "change.file_id", "file.id")
					.where("file.path", "=", "/prosemirror.json")
					.where(changeIsLeafInVersion({ id: currentVersionId }))
					.select("change.id")
					.execute();

				console.log("Fetched intermediate changes:", intermediateChangeIdsData);
				setIntermediateChangeIds(intermediateChangeIdsData);
			} catch (error) {
				console.error("Error fetching intermediate changes:", error);
				setIntermediateChangeIds([]);
			}

			setLoading(false);
		} catch (error) {
			console.error("Error fetching checkpoint data:", error);
			setCheckpoints([]);
			setLoading(false);
		}
	};

	useEffect(() => {
		if (currentVersionId && lix) {
			console.log("Current version ID:", currentVersionId);
			fetchData();

			// Poll for changes
			const intervalId = setInterval(fetchData, 2000);
			return () => clearInterval(intervalId);
		}
	}, [lix, currentVersionId]);

	const handleCreateCheckpoint = async () => {
		if (isCreatingCheckpoint || !currentVersionId || !lix) return;

		setIsCreatingCheckpoint(true);
		try {
			console.log("Attempting to create checkpoint...");
			console.log("Current version ID:", currentVersionId);
			console.log("Description:", description);

			const result = await createCheckpoint(lix, currentVersionId, description);
			if (!result) {
				throw new Error("No result returned from createCheckpoint");
			}
			console.log("Checkpoint created successfully:", result);
			setDescription(""); // Clear the description field
			await fetchData(); // Refresh the data
		} catch (error) {
			console.error("Error creating checkpoint:", error);
			alert(
				"Error creating checkpoint: " +
					(error instanceof Error ? error.message : String(error)),
			);
		} finally {
			setIsCreatingCheckpoint(false);
		}
	};

	const handleRestoreCheckpoint = (checkpointId: string) => {
		if (
			confirm(
				"Are you sure you want to restore to this checkpoint? Any unsaved changes will be lost.",
			)
		) {
			onRestoreCheckpoint(checkpointId);
		}
	};

	return (
		<div
			className="checkpoint-sidebar"
			style={{
				width: "300px",
				padding: "15px",
				borderLeft: "1px solid #e0e0e0",
				height: "100%",
				overflowY: "auto",
			}}
		>
			<h3>Checkpoints</h3>

			{/* Create checkpoint section */}
			<div className="create-checkpoint" style={{ marginBottom: "20px" }}>
				<h4>Create Checkpoint</h4>
				<input
					type="text"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="Describe your checkpoint"
					style={{
						width: "100%",
						padding: "8px",
						marginBottom: "10px",
						borderRadius: "4px",
						border: "1px solid #ccc",
					}}
				/>
				<button
					onClick={handleCreateCheckpoint}
					disabled={
						!currentVersionId ||
						intermediateChangeIds.length === 0 ||
						isCreatingCheckpoint
					}
					style={{
						backgroundColor:
							!currentVersionId ||
							intermediateChangeIds.length === 0 ||
							isCreatingCheckpoint
								? "#cccccc"
								: "#4a90e2",
						color: "white",
						border: "none",
						borderRadius: "4px",
						padding: "8px 16px",
						cursor:
							!currentVersionId ||
							intermediateChangeIds.length === 0 ||
							isCreatingCheckpoint
								? "not-allowed"
								: "pointer",
						width: "100%",
					}}
				>
					{isCreatingCheckpoint
						? "Creating Checkpoint..."
						: !currentVersionId
							? "Loading Version..."
							: intermediateChangeIds.length === 0
								? "No Changes to Checkpoint"
								: description
									? "Create Checkpoint"
									: "Create Checkpoint Without Description"}
				</button>
				{intermediateChangeIds.length > 0 && (
					<div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
						{intermediateChangeIds.length} change
						{intermediateChangeIds.length !== 1 ? "s" : ""} to checkpoint
					</div>
				)}
			</div>

			{/* Checkpoints list */}
			<div className="checkpoints-list">
				<h4>History</h4>
				{loading ? (
					<p>Loading checkpoints...</p>
				) : checkpoints.length === 0 ? (
					<p>
						No checkpoints yet. Make some changes and create your first
						checkpoint!
					</p>
				) : (
					checkpoints.map((checkpoint) => (
						<div
							key={checkpoint.id}
							className="checkpoint-item"
							style={{
								marginBottom: "15px",
								padding: "10px",
								backgroundColor: "#f9f9f9",
								borderRadius: "4px",
								border: "1px solid #e0e0e0",
							}}
						>
							<div style={{ marginBottom: "5px", fontWeight: "bold" }}>
								{checkpoint.first_comment_content || "Checkpoint"}
							</div>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									fontSize: "12px",
									color: "#666",
								}}
							>
								<span>{checkpoint.author_name || "Unknown Author"}</span>
								<span>
									{checkpoint.checkpoint_created_at
										? new Date(
												checkpoint.checkpoint_created_at,
											).toLocaleString()
										: "Unknown date"}
								</span>
							</div>
							<button
								onClick={() => handleRestoreCheckpoint(checkpoint.id)}
								style={{
									marginTop: "10px",
									backgroundColor: "#9c27b0",
									color: "white",
									border: "none",
									borderRadius: "4px",
									padding: "6px 12px",
									cursor: "pointer",
									fontSize: "12px",
								}}
							>
								Restore
							</button>
						</div>
					))
				)}
			</div>
		</div>
	);
};

export default CheckpointSidebar;
