import { useState } from "react";
import { useQuery } from "@lix-js/react-utils";
import type { ViewContext } from "../../types";
import { selectWorkingDiffFiles } from "./queries";
import { ChangedFilesList } from "./changed-files-list";
import { CheckpointForm } from "./checkpoint-form";
import { LatestCheckpoint } from "./latest-checkpoint";

/**
 * Checkpoint view - Shows working changes and allows creating checkpoints
 */
type CheckpointViewProps = {
	readonly context?: ViewContext;
};

export function CheckpointView(_props: CheckpointViewProps) {
	const [message, setMessage] = useState("");
	const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

	const changedFiles = useQuery(({ lix }) => selectWorkingDiffFiles(lix)) ?? [];
	const validFileIds = new Set(changedFiles.map((file) => file.id));
	const visibleSelection = new Set<string>();
	for (const id of selectedFiles) {
		if (validFileIds.has(id)) {
			visibleSelection.add(id);
		}
	}

	const latestCheckpoint = null;

	const handleToggleFile = (fileId: string) => {
		setSelectedFiles((prev) => {
			const next = new Set<string>();
			for (const id of prev) {
				if (validFileIds.has(id)) {
					next.add(id);
				}
			}
			if (next.has(fileId)) {
				next.delete(fileId);
			} else {
				next.add(fileId);
			}
			return next;
		});
	};

	const handleToggleAll = () => {
		if (visibleSelection.size === changedFiles.length) {
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
					selectedFiles={visibleSelection}
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
