import { CalendarDays, FileText, Files, Search } from "lucide-react";
import type { ViewDefinition, ViewId } from "./types";
import { FilesView } from "./panel-views/files-view";
import { SearchView } from "./panel-views/search-view";
import { TasksView } from "./panel-views/tasks-view";
import { FileContentView } from "./panel-views/file-content-view";

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
		id: "file-content",
		label: "File",
		description: "Display file contents.",
		icon: FileText,
		render: (_context, instance) => (
			<FileContentView fileName={instance?.metadata?.fileName ?? "untitled"} />
		),
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
