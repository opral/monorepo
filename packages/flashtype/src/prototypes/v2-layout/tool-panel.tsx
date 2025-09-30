import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import type { ToolDefinition } from "./types";

interface ToolPanelProps {
	readonly tool: ToolDefinition;
}

/**
 * Wraps the active tool content in the card chrome used across Fleet.
 *
 * @example
 * <ToolPanel tool={tool} />
 */
export function ToolPanel({ tool }: ToolPanelProps) {
	return (
		<div className="flex h-full flex-col gap-3 rounded-[18px] border border-[#d9dce3] bg-[#fdfdff] px-4 py-4">
			<header className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edeff5] text-[#33384a]">
						<tool.icon className="h-4 w-4" />
					</div>
					<div>
						<div className="text-sm font-medium text-[#212430]">{tool.label}</div>
						<div className="text-xs text-[#6f7586]">{tool.description}</div>
					</div>
				</div>
				<Button
					variant="ghost"
					size="sm"
					className="h-8 rounded-md px-3 text-xs text-[#3d4251] hover:bg-[#edeff5]"
				>
					<Sparkles className="mr-1 h-3.5 w-3.5" />
					Command
				</Button>
			</header>
			<div className="flex-1 overflow-auto text-sm text-[#3f4454]">
				{tool.render()}
			</div>
		</div>
	);
}
