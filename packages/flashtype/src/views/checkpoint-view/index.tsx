import { useCallback, useMemo, useState } from "react";
import { Flag } from "lucide-react";
import { LixProvider, useLix, useQuery } from "@lix-js/react-utils";
import { createCheckpoint } from "@lix-js/sdk";
import { selectWorkingDiffFiles } from "./queries";
import type { ViewContext } from "../../app/types";
import { ChangedFilesList } from "./changed-files-list";
import { CheckpointForm } from "./checkpoint-form";
import { LatestCheckpoint } from "./latest-checkpoint";
import { createReactViewDefinition } from "../../app/react-view";
import {
	CHECKPOINT_VIEW_KIND,
	DIFF_VIEW_KIND,
	HISTORY_VIEW_KIND,
	buildDiffViewProps,
	diffViewInstance,
	historyViewInstance,
} from "../../app/view-instance-helpers";

/**
 * Checkpoint view - Shows working changes and allows creating checkpoints
 */
type CheckpointViewProps = {
	readonly context?: ViewContext;
};

export function CheckpointView({ context }: CheckpointViewProps) {
	const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
	const [isCreating, setIsCreating] = useState(false);
	const lix = useLix();

	const files = useQuery(({ lix }) => selectWorkingDiffFiles(lix));

	const validFileIds = useMemo(
		() => new Set(files.map((file) => file.id)),
		[files],
	);

	const visibleSelection = useMemo(() => {
		const filtered = new Set<string>();
		for (const id of selectedFiles) {
			if (validFileIds.has(id)) {
				filtered.add(id);
			}
		}
		return filtered;
	}, [selectedFiles, validFileIds]);

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
		if (isCreating) {
			return;
		}
		setIsCreating(true);
		try {
			await createCheckpoint({ lix });
			setSelectedFiles(new Set());
		} catch (error) {
			console.error("Failed to create checkpoint", error);
		} finally {
			setIsCreating(false);
		}
	};

	const handleOpenDiff = useCallback(
		(fileId: string, filePath: string) => {
			if (!context?.openView) return;
			const decodedPath = decodeURIComponent(filePath);
			context.openView({
				panel: "central",
				kind: DIFF_VIEW_KIND,
				instance: diffViewInstance(fileId),
				props: buildDiffViewProps({
					fileId,
					filePath: decodedPath,
				}),
				focus: false,
			});
		},
		[context],
	);

	const handleViewHistory = useCallback(() => {
		context?.openView?.({
			panel: "central",
			kind: HISTORY_VIEW_KIND,
			instance: historyViewInstance(),
			focus: true,
		});
	}, [context]);

	return (
		<div className="flex min-h-0 flex-1 flex-col px-1 py-1">
			<div className="flex-1 overflow-y-auto">
				<ChangedFilesList
					files={files}
					selectedFiles={visibleSelection}
					onToggleFile={handleToggleFile}
					onToggleAll={handleToggleAll}
					openDiffView={handleOpenDiff}
				/>
			</div>

			<div className="sticky bottom-0 flex-shrink-0 bg-neutral-0">
				<CheckpointForm
					onCreateCheckpoint={handleCreateCheckpoint}
					isSubmitting={isCreating}
				/>

				<div className="border-t border-border" />

				<LatestCheckpoint
					checkpoint={latestCheckpoint}
					onViewHistory={handleViewHistory}
				/>
			</div>
		</div>
	);
}

/**
 * Checkpoint panel view definition used by the registry.
 *
 * @example
 * import { view as checkpointView } from "@/views/checkpoint-view";
 */
export const view = createReactViewDefinition({
	kind: CHECKPOINT_VIEW_KIND,
	label: "Checkpoint",
	description: "View working changes and create checkpoints.",
	icon: Flag,
	component: ({ context }) => (
		<LixProvider lix={context.lix}>
			<CheckpointView context={context} />
		</LixProvider>
	),
	activate: ({ context }) => {
		const query = selectWorkingDiffFiles(context.lix);
		const subscription = context.lix.observe(query).subscribe({
			next: (rows) => {
				const count = rows.length;
				context.setTabBadgeCount(count > 0 ? count : null);
			},
			error: () => {
				context.setTabBadgeCount(null);
			},
		});
		return () => {
			subscription.unsubscribe();
			context.setTabBadgeCount(null);
		};
	},
});
