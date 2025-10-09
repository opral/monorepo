import { useState } from "react";
import { useLix, useQuery } from "@lix-js/react-utils";
import { createCheckpoint } from "@lix-js/sdk";
import { selectWorkingDiffFiles } from "./queries";
import type { ViewContext } from "../../app/types";
import { ChangedFilesList } from "./changed-files-list";
import { CheckpointForm } from "./checkpoint-form";
import { LatestCheckpoint } from "./latest-checkpoint";

/**
 * Checkpoint view - Shows working changes and allows creating checkpoints
 */
type CheckpointViewProps = {
	readonly context?: ViewContext;
};

export function CheckpointView({ context }: CheckpointViewProps) {
	const [message, setMessage] = useState("");
	const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
	const [isCreating, setIsCreating] = useState(false);
	const lix = useLix();

	const files = useQuery(({ lix }) => selectWorkingDiffFiles(lix)) ?? [];
	const validFileIds = new Set(files.map((file) => file.id));
	const visibleSelection = (() => {
		const filtered = new Set<string>();
		for (const id of selectedFiles) {
			if (validFileIds.has(id)) {
				filtered.add(id);
			}
		}
		return filtered;
	})();

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
		if (visibleSelection.size === files.length) {
			setSelectedFiles(new Set());
		} else {
			setSelectedFiles(new Set(files.map((f) => f.id)));
		}
	};

	const handleCreateCheckpoint = async () => {
		const trimmed = message.trim();
		if (!trimmed || isCreating) {
			return;
		}
		setIsCreating(true);
		try {
			await createCheckpoint({ lix });
			setMessage("");
			setSelectedFiles(new Set());
		} catch (error) {
			console.error("Failed to create checkpoint", error);
		} finally {
			setIsCreating(false);
		}
	};

	const handleOpenDiff = context?.onOpenDiff
		? (fileId: string, filePath: string) =>
				context.onOpenDiff?.(fileId, decodeURIComponent(filePath))
		: undefined;

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="flex-1 overflow-y-auto">
				<ChangedFilesList
					files={files}
					selectedFiles={visibleSelection}
					onToggleFile={handleToggleFile}
					onToggleAll={handleToggleAll}
					onOpenDiff={handleOpenDiff}
				/>
			</div>

			<div className="sticky bottom-0 flex-shrink-0 bg-neutral-0">
				<CheckpointForm
					message={message}
					onMessageChange={setMessage}
					onCreateCheckpoint={handleCreateCheckpoint}
					isSubmitting={isCreating}
				/>

				<div className="border-t border-border" />

				<LatestCheckpoint checkpoint={latestCheckpoint} />
			</div>
		</div>
	);
}
