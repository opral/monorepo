import { useId } from "react";
import { ArrowUp, ChevronDown, Plus } from "lucide-react";
import type { ViewContext } from "../../types";

type AgentViewProps = {
	readonly context?: ViewContext;
};

/**
 * Barebones agent panel placeholder styled similar to Claude Code's layout.
 */

export function AgentView({ context }: AgentViewProps) {
	const textAreaId = useId();
	// TODO: replace with actual conversation state once wired
	const hasConversations = false;
	const conversationLabel = hasConversations
		? "New conversation"
		: "No previous conversations";

	return (
		<div className="flex min-h-0 flex-1 flex-col bg-[radial-gradient(circle_at_top,_theme(colors.emerald.50/30)_0%,_transparent_55%)]">
			<div className="border-b border-border/80" />
			<header className="flex items-center justify-between border-b border-border/80 py-1">
				<button
					type="button"
					disabled={!hasConversations}
					className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium text-foreground transition hover:text-foreground/70 disabled:cursor-default disabled:text-muted-foreground"
				>
					<span>{conversationLabel}</span>
					<ChevronDown className="h-4 w-4" />
				</button>
				<button
					type="button"
					className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground/70"
				>
					<Plus className="h-4 w-4" />
				</button>
			</header>
			<div className="flex flex-1 flex-col overflow-hidden">
				<div className="flex-1 overflow-y-auto px-6 py-6">
					<div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/40 text-sm text-muted-foreground">
						Conversation history will appear here.
					</div>
				</div>
				<div className="sticky bottom-0 flex justify-center px-2 pb-2 pt-6">
					<form className="w-full max-w-3xl overflow-hidden rounded-md border border-border/80 bg-background">
						<label htmlFor={textAreaId} className="sr-only">
							Ask the assistant
						</label>
						<textarea
							id={textAreaId}
							placeholder="Ask Lix Agent…"
							className="h-28 w-full resize-none border-b border-border/70 bg-transparent px-3 py-3 text-sm leading-6 text-foreground outline-none focus-visible:bg-muted/40"
						/>
						<div className="flex items-center justify-end gap-2 bg-muted/40 px-3 py-1 text-[10px] text-muted-foreground">
							<span className="text-muted-foreground/60">/</span>
							<button
								type="submit"
								className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground transition hover:bg-muted/80"
							>
								<ArrowUp className="h-3.5 w-3.5" />
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}

export default AgentView;
