import {
	CalendarDays,
	Command,
	GitCommit,
	MessageSquare,
	Search,
	Terminal,
} from "lucide-react";
import type { ToolDefinition, ToolId } from "./types";
import { FilesTool } from "./panel-tools/files-tool";
import { SearchTool } from "./panel-tools/search-tool";
import { GitTool } from "./panel-tools/git-tool";
import { AssistantTool } from "./panel-tools/assistant-tool";
import { TerminalTool } from "./panel-tools/terminal-tool";
import { TasksTool } from "./panel-tools/tasks-tool";

/**
 * Canonical catalogue of prototype tools available to each panel.
 *
 * @example
 * const filesTool = TOOL_DEFINITIONS.find((tool) => tool.id === "files");
 */
export const TOOL_DEFINITIONS: ToolDefinition[] = [
	{
		id: "files",
		label: "Files",
		description: "Browse and pin project documents.",
		icon: Command,
		render: () => <FilesTool />,
	},
	{
		id: "search",
		label: "Search",
		description: "Quickly locate files, symbols, or commands.",
		icon: Search,
		render: () => <SearchTool />,
	},
	{
		id: "git",
		label: "Git",
		description: "Review progress and staging status.",
		icon: GitCommit,
		render: () => <GitTool />,
	},
	{
		id: "assistant",
		label: "Assistant",
		description: "Chat with the embedded helper.",
		icon: MessageSquare,
		render: () => <AssistantTool />,
	},
	{
		id: "terminal",
		label: "Terminal",
		description: "Run quick project commands.",
		icon: Terminal,
		render: () => <TerminalTool />,
	},
	{
		id: "tasks",
		label: "Tasks",
		description: "Track the current sprint notes.",
		icon: CalendarDays,
		render: () => <TasksTool />,
	},
];

export const TOOL_MAP = new Map<ToolId, ToolDefinition>(
	TOOL_DEFINITIONS.map((tool) => [tool.id, tool]),
);

let toolCounter = 0;

/**
 * Generates a stable identifier for each opened tool instance.
 *
 * @example
 * const id = createToolInstanceId("files");
 */
export function createToolInstanceId(toolId: ToolId): string {
	toolCounter += 1;
	return `${toolId}-${toolCounter}`;
}
