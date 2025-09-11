import * as React from "react";
import { Zap } from "lucide-react";

/**
 * Minimal loading bar shown while the agent is working.
 *
 * Swaps into the prompt position and keeps the same dimensions to avoid
 * layout shifts. Shows an elapsed timer and a hint to interrupt.
 *
 * @example
 * <LoadingBar />
 */
export function LoadingBar({ onInterrupt }: { onInterrupt?: () => void }) {
	const [elapsed, setElapsed] = React.useState(0);

	React.useEffect(() => {
		const t = setInterval(() => setElapsed((s) => s + 1), 1000);
		return () => clearInterval(t);
	}, []);

	React.useEffect(() => {
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") {
				onInterrupt?.();
			}
		}
		window.addEventListener("keydown", onKey, { capture: true });
		return () =>
			window.removeEventListener("keydown", onKey, { capture: true } as any);
	}, [onInterrupt]);

	return (
		<div className="px-1 py-2 shrink-0">
			<div className="mx-auto max-w-[720px]">
				<div className="min-h-[36px] w-full rounded-md bg-background px-3 py-2 font-mono text-xs leading-snug flex items-center gap-2">
					<Zap className="h-3.5 w-3.5 text-yellow-500 animate-pulse" />
					<span className="text-foreground/90">Working…</span>
					<span className="text-muted-foreground">
						({elapsed}s • Esc to interrupt)
					</span>
				</div>
			</div>
		</div>
	);
}
