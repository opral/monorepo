import {
	CalendarDays,
	Command,
	GitCommit,
	MessageSquare,
	Search,
	Terminal,
} from "lucide-react";
import type { ViewDefinition, ViewId } from "./types";
import { FilesView } from "./panel-views/files-view";
import { SearchView } from "./panel-views/search-view";
import { GitView } from "./panel-views/git-view";
import { AssistantView } from "./panel-views/assistant-view";
import { TerminalView } from "./panel-views/terminal-view";
import { TasksView } from "./panel-views/tasks-view";

/**
 * Canonical catalogue of prototype views available to each panel.
 *
 * @example
 * const filesView = VIEW_DEFINITIONS.find((ext) => ext.id === "files");
 */
export const VIEW_DEFINITIONS: ViewDefinition[] = [
	{
		id: "files",
		label: "Files",
		description: "Browse and pin project documents.",
		icon: Command,
		render: () => <FilesView />,
	},
	{
		id: "search",
		label: "Search",
		description: "Quickly locate files, symbols, or commands.",
		icon: Search,
		render: () => <SearchView />,
	},
	{
		id: "git",
		label: "Git",
		description: "Review progress and staging status.",
		icon: GitCommit,
		render: () => <GitView />,
	},
	{
		id: "assistant",
		label: "Assistant",
		description: "Chat with the embedded helper.",
		icon: MessageSquare,
		render: () => <AssistantView />,
	},
	{
		id: "terminal",
		label: "Terminal",
		description: "Run quick project commands.",
		icon: Terminal,
		render: () => <TerminalView />,
	},
	{
		id: "tasks",
		label: "Tasks",
		description: "Track the current sprint notes.",
		icon: CalendarDays,
		render: () => <TasksView />,
	},
];

export const VIEW_MAP = new Map<ViewId, ViewDefinition>(
	VIEW_DEFINITIONS.map((ext) => [ext.id, ext]),
);

let viewCounter = 0;

/**
 * Generates a stable identifier for each opened view instance.
 *
 * @example
 * const id = createViewInstanceId("files");
 */
export function createViewInstanceId(viewId: ViewId): string {
	viewCounter += 1;
	return `${viewId}-${viewCounter}`;
}
