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
		<div className="flex-1 overflow-auto text-sm text-[#3f4454]">
			{tool.render()}
		</div>
	);
}
