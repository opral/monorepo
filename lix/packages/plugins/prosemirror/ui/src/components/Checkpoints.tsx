import { useQuery } from "../hooks/useQuery";
import { selectCheckpoints, selectCurrentChangeSet } from "../queries";
import { ChangeSet, ChangeSetHandle } from "./ChangeSet";
import { createCheckpointV2 } from "../utilities/createCheckpoint";
import { useRef } from "react";
import { useKeyValue } from "../hooks/useKeyValue";

const Checkpoints: React.FC = () => {
	const [stateCheckpoints] = useQuery(selectCheckpoints);
	const [currentChangeSet] = useQuery(selectCurrentChangeSet);
	const [, setExpandedChangeSetId] = useKeyValue<string | null>(
		"checkpoints.expandedChangeSetId",
	);
	const changeSetRef = useRef<ChangeSetHandle>(null);

	const handleCreateCheckpoint = async () => {
		// Get the comment text from the ChangeSet component
		const commentText = changeSetRef.current?.getCommentText() || "";

		// Create the checkpoint and add the comment if it exists
		await createCheckpointV2(commentText);

		// Close any expanded change set
		setExpandedChangeSetId(null);

		// Clear the comment text field after creating the checkpoint
		changeSetRef.current?.clearCommentText();
	};

	return (
		<>
			<div
				className="checkpoints-list"
				style={{ maxHeight: "400px", overflow: "auto" }}
			>
				{/* Current changes (to be checkpointed) */}
				{currentChangeSet && currentChangeSet.change_count > 0 && (
					<div className="border-b border-base-300">
						<ChangeSet
							ref={changeSetRef}
							key="current-changes"
							changeSet={currentChangeSet}
							isCurrentChangeSet={true}
							showRestore={false}
							footer={
								<div className="flex justify-end mt-2">
									<button className="btn" onClick={handleCreateCheckpoint}>
										Create Checkpoint
									</button>
								</div>
							}
						/>
					</div>
				)}

				{stateCheckpoints?.map((checkpoint) => {
					return (
						<div key={checkpoint.id}>
							<ChangeSet key={checkpoint.id} changeSet={checkpoint} />
						</div>
					);
				})}
			</div>
		</>
	);
};

export default Checkpoints;
