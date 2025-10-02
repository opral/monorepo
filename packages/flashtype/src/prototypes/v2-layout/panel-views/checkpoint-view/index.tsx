import { useState } from "react";
import { useQuery } from "@lix-js/react-utils";
import { selectWorkingDiffCount, selectCheckpoints } from "@/queries";
import type { ViewContext } from "../../types";
import { ChangedFilesList } from "./changed-files-list";
import { CheckpointForm } from "./checkpoint-form";
import { LatestCheckpoint } from "./latest-checkpoint";

type CheckpointViewProps = {
	readonly context?: ViewContext;
};

/**
 * Checkpoint view - Shows working changes and allows creating checkpoints
 */
export function CheckpointView({ context }: CheckpointViewProps) {
	const [message, setMessage] = useState("");
	const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

	// Query working changes count (commented out for now)
	// const diffCount = useQuery(({ lix }) => selectWorkingDiffCount(lix));

	// Query changed files (placeholder - we'll implement this query)
	const changedFiles = [
		{ id: "1", path: "AGENTS.md" },
		{ id: "2", path: "writing-style.md" },
	]; // TODO: implement real query

	// Query latest checkpoint (commented out for now)
	// const latestCheckpoint = useQuery(({ lix }) => selectCheckpoints({ lix }).limit(1));
	const latestCheckpoint = null;

	const handleToggleFile = (fileId: string) => {
		setSelectedFiles((prev) => {
			const next = new Set(prev);
			if (next.has(fileId)) {
				next.delete(fileId);
			} else {
				next.add(fileId);
			}
			return next;
		});
	};

	const handleToggleAll = () => {
		if (selectedFiles.size === changedFiles.length) {
			setSelectedFiles(new Set());
		} else {
			setSelectedFiles(new Set(changedFiles.map((f) => f.id)));
		}
	};

	const handleCreateCheckpoint = async () => {
		// TODO: Implement checkpoint creation
		console.log("Creating checkpoint with message:", message);
		setMessage("");
	};

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="flex-1 overflow-y-auto">
				<ChangedFilesList
					files={changedFiles}
					selectedFiles={selectedFiles}
					onToggleFile={handleToggleFile}
					onToggleAll={handleToggleAll}
				/>
			</div>

			<div className="sticky bottom-0 flex-shrink-0 bg-neutral-0">
				<CheckpointForm
					message={message}
					onMessageChange={setMessage}
					onCreateCheckpoint={handleCreateCheckpoint}
				/>

				<div className="border-t border-border" />

				<LatestCheckpoint checkpoint={latestCheckpoint} />
			</div>
		</div>
	);
}
