import { selectCheckpoints, selectWorkingChangeSet } from "../queries";
import { ChangeSet, ChangeSetHandle } from "./ChangeSet";
import { useRef } from "react";
import { useKeyValue } from "../hooks/useKeyValue";
import { createCheckpoint } from "@lix-js/sdk";
import { useLix, useQuery, useQueryTakeFirst } from "@lix-js/react-utils";

const Checkpoints: React.FC = () => {
	const lix = useLix();
	// const activeVersion = useQueryTakeFirstOrThrow(selectActiveVersion);
	const checkpoints = useQuery((lix) => selectCheckpoints(lix));
	const workingChangeSet = useQueryTakeFirst(selectWorkingChangeSet);
	const [, setExpandedChangeSetId] = useKeyValue<string | null>(
		"expandedChangeSetId",
		{ versionId: "global", untracked: true },
	);
	const changeSetRef = useRef<ChangeSetHandle>(null);

	const handleCreateCheckpoint = async () => {
		// Get the comment text from the ChangeSet component
		// const commentText = changeSetRef.current?.getCommentText() || "";

		// Create the checkpoint and add the comment if it exists
		await createCheckpoint({ lix });

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
				{workingChangeSet && (
					<div className="border-b border-base-300">
						<ChangeSet
							ref={changeSetRef}
							key="current-changes"
							changeSet={workingChangeSet}
							isWorkingChangeSet={true}
							previousChangeSetId={checkpoints?.[0]?.id ?? undefined}
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

				{checkpoints.map((checkpoint, index) => {
					// Get the previous checkpoint ID (if available)
					const previousCheckpointId = checkpoints[index + 1]?.id ?? undefined;

					return (
						<div key={checkpoint.id}>
							<ChangeSet
								key={checkpoint.id}
								previousChangeSetId={previousCheckpointId}
								// @ts-ignore
								changeSet={checkpoint}
							/>
						</div>
					);
				})}
			</div>
		</>
	);
};

export default Checkpoints;
