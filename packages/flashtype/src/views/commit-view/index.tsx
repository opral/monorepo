import { useCallback } from "react";
import { LixProvider, useQuery } from "@lix-js/react-utils";
import { selectCheckpoints } from "@/queries";
import type { ViewContext, ViewInstance } from "../../app/types";
import { File, GitCommitVertical } from "lucide-react";
import { createReactViewDefinition } from "../../app/react-view";
import { selectCheckpointFiles, type CheckpointFileChangeRow } from "./queries";
import {
	COMMIT_VIEW_KIND,
	DIFF_VIEW_KIND,
	buildDiffViewProps,
	diffViewInstance,
} from "../../app/view-instance-helpers";

type CommitFile = {
	id: string;
	fullPath: string;
	path: string;
	added: number;
	removed: number;
};

type CommitViewProps = {
	readonly context?: ViewContext;
	readonly view?: ViewInstance;
};

const timestampFormatter = new Intl.DateTimeFormat(undefined, {
	hour: "2-digit",
	minute: "2-digit",
	day: "numeric",
	month: "short",
	year: "numeric",
});

function formatTimestamp(value: string | null | undefined): string {
	if (!value) return "Unknown time";
	try {
		return timestampFormatter.format(new Date(value));
	} catch (error) {
		console.warn("Unable to format checkpoint timestamp", error);
		return "Unknown time";
	}
}

export function CommitView({ context, view }: CommitViewProps) {
	const checkpointId = view?.state?.checkpointId as string | undefined;
	const checkpoints = useQuery(({ lix }) => selectCheckpoints({ lix })) ?? [];

	const checkpoint = checkpoints.find((cp) => cp.id === checkpointId);

	const changeSetId = checkpoint?.id ?? "__invalid_checkpoint__";
	const fileRows =
		useQuery(
			({ lix }) =>
				selectCheckpointFiles({
					lix,
					changeSetId,
				}),
			{ subscribe: Boolean(checkpointId) },
		) ?? [];

	const handleOpenDiff = useCallback(
		(file: CommitFile) => {
			if (!context?.openView) return;
			const focus = context.isPanelFocused ? false : undefined;
			context.openView({
				panel: "central",
				kind: DIFF_VIEW_KIND,
				instance: diffViewInstance(file.id),
				state: buildDiffViewProps({
					fileId: file.id,
					filePath: file.fullPath,
				}),
				focus,
			});
		},
		[context],
	);

	if (!checkpoint) {
		return (
			<div className="flex min-h-0 flex-1 items-center justify-center p-6">
				<div className="text-center text-sm text-muted-foreground">
					Checkpoint not found
				</div>
			</div>
		);
	}

	const files: CommitFile[] = fileRows.map((row: CheckpointFileChangeRow) => {
		const added = row.added ?? 0;
		const removed = row.removed ?? 0;
		const rawPath = row.path && row.path.length > 0 ? row.path : row.file_id;
		const normalizedPath = rawPath.replace(/^\/+/, "");
		return {
			id: row.file_id,
			fullPath: rawPath,
			path: normalizedPath,
			added,
			removed,
		};
	});

	const timestamp = formatTimestamp(checkpoint.checkpoint_created_at);

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-auto px-3 py-2">
			{/* Header */}
			<div className="border-b border-border bg-background px-3 py-2">
				<h2 className="text-sm font-semibold text-foreground">
					Upvote issue{" "}
					<a
						className="text-primary underline-offset-4 hover:underline"
						href="https://github.com/opral/flashtype/issues/82"
						target="_blank"
						rel="noreferrer"
					>
						#82
					</a>{" "}
					to add comments to checkpoints
				</h2>
				<p className="mt-0.5 text-xs text-muted-foreground">{timestamp}</p>
			</div>

			{/* File list */}
			<div className="flex-1 overflow-y-auto px-3 py-3">
				{files.length === 0 ? (
					<div className="px-1 py-6 text-center text-xs text-muted-foreground">
						No changes
					</div>
				) : (
					<div className="flex flex-col gap-1">
						{files.map((file) => {
							const summaryParts: string[] = [];
							if (file.added > 0) summaryParts.push(`+${file.added}`);
							if (file.removed > 0) summaryParts.push(`-${file.removed}`);
							const changeSummary =
								summaryParts.length > 0
									? summaryParts.join(" ")
									: `${file.added + file.removed} change${
											file.added + file.removed === 1 ? "" : "s"
										}`;
							return (
								<button
									key={file.id}
									type="button"
									onClick={() => handleOpenDiff(file)}
									className="group flex items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									<File className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
									<span className="flex-1 text-sm text-foreground">
										{file.path}
									</span>
									<span className="text-xs text-muted-foreground">
										{changeSummary}
									</span>
								</button>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}

/**
 * Commit detail view definition used by the registry.
 *
 * @example
 * import { view as commitView } from "@/views/commit-view";
 */
export const view = createReactViewDefinition({
	kind: COMMIT_VIEW_KIND,
	label: "Commit",
	description: "View commit details and changes.",
	icon: GitCommitVertical,
	component: ({ context, instance }) => (
		<LixProvider lix={context.lix}>
			<CommitView context={context} view={instance} />
		</LixProvider>
	),
});
