import * as React from "react";
import { DiffIndicator } from "@/components/diff-indicator";

export function ProposalReviewBarMock({
	total,
	added,
	removed,
	onAccept,
	onReject,
	embedded = false,
}: {
	total: number;
	added: number;
	removed: number;
	onAccept?: () => void;
	onReject?: () => void;
	embedded?: boolean;
}) {
	const Row = (
		<div className="w-full px-3 py-2 font-mono text-[12px] flex items-center justify-between">
			<div className="inline-flex items-center gap-2">
				<DiffIndicator
					added={added}
					removed={removed}
					highRange={30}
					showCounts={false}
				/>
				<span className="text-foreground/80">{total} changes • </span>
				<span className="text-emerald-600">+{added}</span>
				<span className="text-foreground/40"> </span>
				<span className="text-rose-600">−{removed}</span>
			</div>
			<div className="inline-flex items-center gap-3">
				<button
					type="button"
					onClick={onAccept}
					className="underline-offset-2 hover:underline text-muted-foreground text-[11px]"
					aria-label="Accept change proposal"
				>
					<span>Accept</span>
					<span aria-hidden className="ml-1">
						⇥
					</span>
				</button>
				<button
					type="button"
					onClick={onReject}
					className="underline-offset-2 hover:underline text-muted-foreground text-[11px]"
					aria-label="Reject change proposal"
				>
					<span>Reject</span>
					<span aria-hidden className="ml-1">
						Esc
					</span>
				</button>
			</div>
		</div>
	);

	if (embedded) {
		// Borders are provided by the parent PromptStack; render as-is
		return <div className="w-full">{Row}</div>;
	}
	// Standalone demo
	return <div className="mx-auto max-w-[720px] w-full">{Row}</div>;
}
