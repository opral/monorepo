import { CalendarDays, FileText, Files, Flag, GitCommitVertical, Diff, Search } from "lucide-react";
import type { ViewDefinition, ViewId } from "./types";
import { FilesView } from "./panel-views/files-view/index";
import { SearchView } from "./panel-views/search-view/index";
import { TasksView } from "./panel-views/tasks-view/index";
import { MarkdownView } from "./panel-views/markdown-view/index";
import { CheckpointView } from "./panel-views/checkpoint-view/index";
import { HistoryView } from "./panel-views/history-view/index";
import { CommitView } from "./panel-views/commit-view/index";
import { DiffPanelView } from "./panel-views/diff-view/index";

/**
 * Canonical catalogue of prototype views available to each panel.
 *
 * @example
 * const filesView = VIEW_DEFINITIONS.find((ext) => ext.id === "files");
 */
const VISIBLE_VIEWS: ViewDefinition[] = [
	{
		id: "files",
		label: "Files",
		description: "Browse and pin project documents.",
		icon: Files,
		render: (context) => <FilesView context={context} />,
	},
	{
		id: "search",
		label: "Search",
		description: "Quickly locate files, symbols, or commands.",
		icon: Search,
		render: () => <SearchView />,
	},
	{
		id: "tasks",
		label: "Tasks",
		description: "Track the current sprint notes.",
		icon: CalendarDays,
		render: () => <TasksView />,
	},
	{
		id: "checkpoint",
		label: "Checkpoint",
		description: "View working changes and create checkpoints.",
		icon: Flag,
		render: (context) => <CheckpointView context={context} />,
	},
	{
		id: "history",
		label: "History",
		description: "Browse saved checkpoints in chronological order.",
		icon: GitCommitVertical,
		render: (context) => <HistoryView context={context} />,
	},
];

const HIDDEN_VIEWS: ViewDefinition[] = [
	{
		id: "file-content",
		label: "File",
		description: "Display file contents.",
		icon: FileText,
		render: (_context, panelView) => (
			<MarkdownView filePath={panelView?.metadata?.filePath} />
		),
	},
	{
		id: "commit",
		label: "Commit",
		description: "View commit details and changes.",
		icon: GitCommitVertical,
		render: (context, panelView) => (
			<CommitView context={context} view={panelView} />
		),
	},
	{
		id: "diff",
		label: "Diff",
		description: "Inspect changes for a file.",
		icon: Diff,
		render: (_context, panelView) => <DiffPanelView config={panelView?.metadata?.diff} />,
	},
];

export const VIEW_DEFINITIONS: ViewDefinition[] = VISIBLE_VIEWS;

export const VIEW_MAP = new Map<ViewId, ViewDefinition>(
	[...VISIBLE_VIEWS, ...HIDDEN_VIEWS].map((ext) => [ext.id, ext]),
);

let viewCounter = 0;

/**
 * Generates a stable identifier for each opened view inside a panel.
 *
 * @example
 * const key = createViewKey("files");
 */
export function createViewKey(viewId: ViewId): string {
	viewCounter += 1;
	return `${viewId}-${viewCounter}`;
}
