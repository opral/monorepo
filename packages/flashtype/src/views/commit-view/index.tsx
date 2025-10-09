import { useMemo } from "react";
import { useQuery } from "@lix-js/react-utils";
import { selectCheckpoints } from "@/queries";
import type { ViewContext, ViewInstance } from "../../types";
import { File } from "lucide-react";

type CommitFile = {
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

function deriveTitle(added: number, removed: number): string {
	if (added + removed >= 12) return "Major update";
	if (added > 0 && removed > 0) return "Edited content";
	if (added > 0) return "Added content";
	if (removed > 0) return "Clean up";
	return "Checkpoint";
}

export function CommitView({ context: _context, view }: CommitViewProps) {
	const checkpointId = view?.metadata?.checkpointId;
	const checkpoints = useQuery(({ lix }) => selectCheckpoints({ lix })) ?? [];

	const checkpoint = checkpoints.find((cp) => cp.id === checkpointId);

	// Mock file data - replace with actual data from checkpoint
	const files = useMemo<CommitFile[]>(() => {
		if (!checkpoint) return [];
		// TODO: Get actual file changes from checkpoint
		return [
			{ path: "hello-world.md", added: 12, removed: 3 },
			{ path: "writing-style.md", added: 5, removed: 1 },
			{ path: "tasks.md", added: 8, removed: 0 },
		];
	}, [checkpoint]);

	if (!checkpoint) {
		return (
			<div className="flex min-h-0 flex-1 items-center justify-center p-6">
				<div className="text-center text-sm text-muted-foreground">
					Checkpoint not found
				</div>
			</div>
		);
	}

	const title = deriveTitle(checkpoint.added ?? 0, checkpoint.removed ?? 0);
	const timestamp = formatTimestamp(checkpoint.checkpoint_created_at);

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-auto">
			{/* Header */}
			<div className="border-b border-border bg-background px-4 py-3">
				<h2 className="text-sm font-semibold text-foreground">{title}</h2>
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
							const totalChanges = file.added + file.removed;
							return (
								<button
									key={file.path}
									type="button"
									className="group flex items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									<File className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
									<span className="flex-1 text-sm text-foreground">
										{file.path}
									</span>
									<span className="text-xs text-muted-foreground">
										{totalChanges} {totalChanges === 1 ? "change" : "changes"}
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
