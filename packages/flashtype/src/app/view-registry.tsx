import {
	Bot,
	CalendarDays,
	Diff,
	FileText,
	Files,
	Flag,
	GitCommitVertical,
	Search,
} from "lucide-react";
import type { ViewDefinition, ViewKey } from "./types";
import { FilesView } from "../views/files-view/index";
import { SearchView } from "../views/search-view/index";
import { TasksView } from "../views/tasks-view/index";
import { MarkdownView } from "../views/markdown-view/index";
import { CheckpointView } from "../views/checkpoint-view/index";
import { HistoryView } from "../views/history-view/index";
import { CommitView } from "../views/commit-view/index";
import { DiffPanelView } from "../views/diff-view/index";
import { AgentView } from "../views/agent-view/index";

/**
 * Canonical catalogue of prototype views available to each panel.
 *
 * @example
 * const filesView = VIEW_DEFINITIONS.find((ext) => ext.key === "files");
 */
const VISIBLE_VIEWS: ViewDefinition[] = [
	{
		key: "agent",
		label: "Lix Agent",
		description: "Chat with the project assistant.",
		icon: Bot,
		render: (context) => <AgentView context={context} />,
	},
	{
		key: "files",
		label: "Files",
		description: "Browse and pin project documents.",
		icon: Files,
		render: (context) => <FilesView context={context} />,
	},
	{
		key: "search",
		label: "Search",
		description: "Quickly locate files, symbols, or commands.",
		icon: Search,
		render: () => <SearchView />,
	},
	{
		key: "tasks",
		label: "Tasks",
		description: "Track the current sprint notes.",
		icon: CalendarDays,
		render: () => <TasksView />,
	},
	{
		key: "checkpoint",
		label: "Checkpoint",
		description: "View working changes and create checkpoints.",
		icon: Flag,
		render: (context) => <CheckpointView context={context} />,
	},
	{
		key: "history",
		label: "History",
		description: "Browse saved checkpoints in chronological order.",
		icon: GitCommitVertical,
		render: (context) => <HistoryView context={context} />,
	},
];

const HIDDEN_VIEWS: ViewDefinition[] = [
	{
		key: "file-content",
		label: "File",
		description: "Display file contents.",
		icon: FileText,
		render: (_context, panelView) => (
			<MarkdownView filePath={panelView?.metadata?.filePath} />
		),
	},
	{
		key: "commit",
		label: "Commit",
		description: "View commit details and changes.",
		icon: GitCommitVertical,
		render: (context, panelView) => (
			<CommitView context={context} view={panelView} />
		),
	},
	{
		key: "diff",
		label: "Diff",
		description: "Inspect changes for a file.",
		icon: Diff,
		render: (_context, panelView) => (
			<DiffPanelView config={panelView?.metadata?.diff} />
		),
	},
];

export const VIEW_DEFINITIONS: ViewDefinition[] = VISIBLE_VIEWS;

export const VIEW_MAP = new Map<ViewKey, ViewDefinition>(
	[...VISIBLE_VIEWS, ...HIDDEN_VIEWS].map((ext) => [ext.key, ext]),
);

let viewCounter = 0;

/**
 * Generates a stable identifier for each opened view inside a panel.
 *
 * @example
 * const key = createViewInstanceKey("files");
 */
export function createViewInstanceKey(viewKey: ViewKey): string {
	viewCounter += 1;
	return `${viewKey}-${viewCounter}`;
}
