import * as React from "react";
import { DiffIndicator } from "@/components/diff-indicator";

export function ProposalDecisionBar({
	total,
	added,
	removed,
	onAccept,
	onAutoAccept,
	onIterate,
}: {
	total: number;
	added: number;
	removed: number;
	onAccept?: () => void;
	onAutoAccept?: () => void;
	onIterate?: () => void;
}) {
	const [sel, setSel] = React.useState(0); // default to accept
	const rootRef = React.useRef<HTMLDivElement>(null);
	// Auto-focus the decision bar when it mounts so keyboard navigation works immediately
	React.useEffect(() => {
		rootRef.current?.focus();
	}, []);

	const run = (idx: number) => {
		if (idx === 0) onAccept?.();
		else if (idx === 1) onAutoAccept?.();
		else onIterate?.();
	};

	const onKeyDown = (e: React.KeyboardEvent) => {
		const max = 2;
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setSel((s) => Math.min(s + 1, max));
			return;
		}
		if (e.key === "ArrowUp") {
			e.preventDefault();
			setSel((s) => Math.max(s - 1, 0));
			return;
		}
		if (e.key === "Home") {
			e.preventDefault();
			setSel(0);
			return;
		}
		if (e.key === "End") {
			e.preventDefault();
			setSel(max);
			return;
		}
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			run(sel);
			return;
		}
		if (e.key === "1") {
			e.preventDefault();
			run(0);
			return;
		}
		if (e.key === "2") {
			e.preventDefault();
			run(1);
			return;
		}
		if (e.key === "3") {
			e.preventDefault();
			run(2);
			return;
		}
	};

	return (
		<div
			className="w-full focus:outline-none focus-visible:outline-none"
			ref={rootRef}
			tabIndex={0}
			role="menu"
			aria-label="Accept changes"
			onKeyDown={onKeyDown}
		>
			{/* Counts row */}
			<div className="w-full px-3 pt-3 pb-2 font-mono text-[12px] flex items-center justify-between">
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
			</div>

			{/* Simple horizontal divider under counts */}
			<div className="w-full border-b border-border" />

			{/* Decision list */}
			<div className="w-full px-3 py-2 text-[12px] leading-[1.6]">
				<div className="mb-2 text-[12px]">
					Do you want to accept these changes?
				</div>
				<div className="font-mono" role="none">
					<button
						type="button"
						onClick={onAccept}
						className="grid grid-cols-[max-content_1fr] gap-2 items-baseline text-left w-full hover:underline underline-offset-2 focus:outline-none focus-visible:outline-none"
						aria-pressed={sel === 0}
					>
						<span
							className={[
								"inline-block w-4",
								sel === 0
									? "text-[rgb(7,182,212)] font-semibold"
									: "text-foreground",
							].join(" ")}
						>
							1.
						</span>
						<span
							className={[
								sel === 0
									? "text-[rgb(7,182,212)] font-semibold"
									: "text-foreground",
							].join(" ")}
						>
							Yes
						</span>
					</button>
					<button
						type="button"
						onClick={onAutoAccept}
						className="grid grid-cols-[max-content_1fr] gap-2 items-baseline text-left w-full hover:underline underline-offset-2 mt-1 focus:outline-none focus-visible:outline-none"
						aria-pressed={sel === 1}
					>
						<span
							className={[
								"inline-block w-4",
								sel === 1
									? "text-[rgb(7,182,212)] font-semibold"
									: "text-foreground",
							].join(" ")}
						>
							2.
						</span>
						<span
							className={[
								sel === 1
									? "text-[rgb(7,182,212)] font-semibold"
									: "text-foreground/90",
							].join(" ")}
						>
							Yes, auto-accept all changes for this session{" "}
							<span className="text-muted-foreground">(shift + tab)</span>
						</span>
					</button>
					<button
						type="button"
						onClick={onIterate}
						className="grid grid-cols-[max-content_1fr] gap-2 items-baseline text-left w-full hover:underline underline-offset-2 mt-1 focus:outline-none focus-visible:outline-none"
						aria-pressed={sel === 2}
					>
						<span
							className={[
								"inline-block w-4",
								sel === 2
									? "text-[rgb(7,182,212)] font-semibold"
									: "text-foreground",
							].join(" ")}
						>
							3.
						</span>
						<span
							className={[
								sel === 2
									? "text-[rgb(7,182,212)] font-semibold"
									: "text-foreground/90",
							].join(" ")}
						>
							No, and tell the agent what to do differently{" "}
							<span className="text-muted-foreground">(esc)</span>
						</span>
					</button>
				</div>
			</div>
		</div>
	);
}
