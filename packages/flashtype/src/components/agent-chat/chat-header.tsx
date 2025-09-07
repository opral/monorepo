import * as React from "react";
import { Bot, Keyboard } from "lucide-react";

/**
 * Minimal header: communicates the product premise and exposes a help toggle.
 *
 * @example
 * <ChatHeader onToggleHelp={() => setShowHelp(v => !v)} />
 */
export function ChatHeader({ onToggleHelp }: { onToggleHelp?: () => void }) {
	return (
		<div className="flex items-center gap-2 border-b px-3 py-2 text-xs">
			<Bot className="h-3.5 w-3.5 text-amber-500" />
			<div className="font-medium">Agent</div>
			<div className="ml-1 text-muted-foreground">Claude Code for writing</div>
			<div className="ml-auto inline-flex items-center gap-2">
				<button
					type="button"
					className="inline-flex items-center gap-1 rounded-sm border px-2 py-1 text-[11px] hover:bg-accent"
					onClick={onToggleHelp}
					aria-label="Keyboard shortcuts"
					title="Keyboard shortcuts"
				>
					<Keyboard className="h-3.5 w-3.5" />
					<span>Shortcuts</span>
				</button>
			</div>
		</div>
	);
}
