import * as React from "react";
import { DiffIndicator } from "@/components/diff-indicator";

type Checkpoint = {
	id: string | number;
	title: string;
	description: string;
	time: string;
	additions: number;
	deletions: number;
};

const sample: Checkpoint[] = [
	{
		id: "c1",
		title: "Initial draft",
		description: "Added welcome message with basic structure",
		time: "5 min ago",
		additions: 8,
		deletions: 0,
	},
	{
		id: "c2",
		title: "First version",
		description: "Created new document with placeholder content",
		time: "12 min ago",
		additions: 12,
		deletions: 3,
	},
	{
		id: "c3",
		title: "Added introduction section",
		description: "Enhanced document structure with comprehensive intro",
		time: "1 hour ago",
		additions: 15,
		deletions: 1,
	},
];

export function LeftDockHistory() {
	return (
		<div className="flex flex-col gap-3">
			{sample.map((cp) => (
				<HistoryItem key={cp.id} cp={cp} />
			))}
		</div>
	);
}

function HistoryItem({ cp }: { cp: Checkpoint }) {
	return (
		<button className="block w-full cursor-pointer rounded-md border border-transparent p-2 text-left transition-colors hover:border-border hover:bg-secondary/60">
			<div className="flex items-start justify-between gap-1">
				<span className="text-xs text-muted-foreground">{cp.time}</span>
				<DiffIndicator
					added={cp.additions}
					removed={cp.deletions}
					highRange={30}
				/>
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
