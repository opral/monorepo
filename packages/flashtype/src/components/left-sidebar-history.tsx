import * as React from "react";
import { DiffIndicator } from "@/components/diff-indicator";
import { useQuery } from "@lix-js/react-utils";
import { selectCheckpoints } from "@/queries";

type ViewCheckpoint = {
	id: string;
	title: string;
	description: string;
	time: string;
	added: number;
	removed: number;
};

function timeAgo(dateString: string | null | undefined): string {
	if (!dateString) return "";
	const now = new Date();
	const pastDate = new Date(dateString);
	const secondsAgo = Math.floor((now.getTime() - pastDate.getTime()) / 1000);
	const intervals: Record<string, number> = {
		year: 31536000,
		month: 2592000,
		week: 604800,
		day: 86400,
		hour: 3600,
		minute: 60,
	};
	if (secondsAgo < intervals.minute) return "a few seconds ago";
	for (const [unit, secs] of Object.entries(intervals)) {
		const count = Math.floor(secondsAgo / secs);
		if (count >= 1) {
			if (unit === "year")
				return pastDate.toLocaleDateString("en", {
					day: "numeric",
					month: "long",
					year: "numeric",
				});
			return `${count} ${unit}${count > 1 ? "s" : ""} ago`;
		}
	}
	return "just now";
}

export function LeftSidebarHistory() {
	const rows = useQuery(({ lix }) => selectCheckpoints({ lix }));

	const items: ViewCheckpoint[] = React.useMemo(() => {
		return rows.map((r) => {
			const adds = (r.added ?? 0) as number;
			const dels = (r.removed ?? 0) as number;
			const total = adds + dels;

			let title = "Checkpoint";
			if (total >= 12) title = "Major update";
			else if (adds > 0 && dels > 0) title = "Edited content";
			else if (adds > 0) title = "Added content";
			else if (dels > 0) title = "Clean up";

			const parts: string[] = [];
			if (adds > 0) parts.push(`${adds} addition${adds === 1 ? "" : "s"}`);
			if (dels > 0) parts.push(`${dels} deletion${dels === 1 ? "" : "s"}`);
			const description = parts.length
				? `Captured ${parts.join(" · ")}`
				: "No content changes captured";

			return {
				id: r.id,
				title,
				description,
				time: timeAgo(r.checkpoint_created_at),
				added: adds,
				removed: dels,
			};
		});
	}, [rows]);

	return (
		<div className="flex flex-col gap-3">
			{items.length === 0 ? (
				<div className="px-2 py-3 text-xs text-muted-foreground">
					No checkpoints yet
				</div>
			) : (
				items.map((cp) => <HistoryItem key={cp.id} cp={cp} />)
			)}
		</div>
	);
}

function HistoryItem({ cp }: { cp: ViewCheckpoint }) {
	return (
		<button className="block w-full cursor-pointer rounded-md border border-transparent p-2 text-left transition-colors hover:border-border hover:bg-secondary/60">
			<div className="flex items-start justify-between gap-1">
				<span className="text-xs text-muted-foreground">{cp.time}</span>
				<DiffIndicator added={cp.added} removed={cp.removed} highRange={30} />
			</div>
			<div className="mt-1.5">
				<div className="text-sm font-semibold leading-snug">{cp.title}</div>
				<div className="mt-1 text-xs text-muted-foreground">
					{cp.description}
				</div>
			</div>
		</button>
	);
}
