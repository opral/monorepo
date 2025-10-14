import { useEffect, useState } from "react";
import { GitCommitVertical } from "lucide-react";
import clsx from "clsx";
import { LixProvider, useQuery } from "@lix-js/react-utils";
import { selectCheckpoints } from "@/queries";
import type { ViewContext } from "../../app/types";
import { createReactViewDefinition } from "../../app/react-view";

type HistoryCheckpoint = {
	id: string;
	title: string;
	timestampLabel: string;
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

type HistoryViewProps = {
	readonly context?: ViewContext;
};

export function HistoryView({ context }: HistoryViewProps) {
	const checkpoints = useQuery(({ lix }) => selectCheckpoints({ lix })) ?? [];

	const items: HistoryCheckpoint[] = checkpoints.map((cp) => ({
		id: cp.id,
		title: deriveTitle(cp.added ?? 0, cp.removed ?? 0),
		timestampLabel: formatTimestamp(cp.checkpoint_created_at),
	}));

	const [selectedId, setSelectedId] = useState<string | null>(null);

	useEffect(() => {
		if (items.length === 0) {
			setSelectedId(null);
			return;
		}
		if (!selectedId || !items.some((item) => item.id === selectedId)) {
			setSelectedId(items[0]?.id ?? null);
		}
	}, [items, selectedId]);

	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-auto px-3 py-2">
			{items.length === 0 ? (
				<div className="px-1 py-6 text-center text-xs text-muted-foreground">
					No checkpoints yet
				</div>
			) : (
				<div className="flex flex-col gap-1">
					{items.map((item, index) => {
						const isSelected = item.id === selectedId;
						return (
							<div key={item.id} className="flex gap-2 pl-1">
								<div className="relative flex w-6 flex-col items-center pt-2">
									<span
										aria-hidden
										className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-border"
									/>
									{index < items.length - 1 ? (
										<span aria-hidden className="mt-1 w-px flex-1 bg-border" />
									) : null}
								</div>
								<button
									type="button"
									onClick={() => {
										setSelectedId(item.id);
										context?.onOpenCommit?.(
											item.id,
											`${item.title} • ${item.timestampLabel}`,
											context?.isPanelFocused ? { focus: false } : undefined,
										);
									}}
									className={clsx(
										"group relative flex w-full flex-col gap-0.5 rounded-md px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
										isSelected
											? "bg-muted border border-border"
											: "border border-transparent hover:bg-muted/60",
									)}
								>
									<span className="text-sm font-medium leading-5 text-foreground">
										{item.title}
									</span>
									<span className="text-xs leading-4 text-muted-foreground">
										{item.timestampLabel}
									</span>
								</button>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}

/**
 * History panel view definition used by the registry.
 *
 * @example
 * import { view as historyView } from "@/views/history-view";
 */
export const view = createReactViewDefinition({
	key: "history",
	label: "History",
	description: "Browse saved checkpoints in chronological order.",
	icon: GitCommitVertical,
	component: ({ context }) => (
		<LixProvider lix={context.lix}>
			<HistoryView context={context} />
		</LixProvider>
	),
});
