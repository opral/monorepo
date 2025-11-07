import type { ViewDefinition, ViewKey } from "./types";
import { view as agentViewDefinition } from "../views/agent-view";
import { view as filesViewDefinition } from "../views/files-view";
import { view as searchViewDefinition } from "../views/search-view";
import { view as tasksViewDefinition } from "../views/tasks-view";
import { view as checkpointViewDefinition } from "../views/checkpoint-view";
import { view as historyViewDefinition } from "../views/history-view";
import { view as markdownViewDefinition } from "../views/markdown-view";
import { view as commitViewDefinition } from "../views/commit-view";
import { view as diffViewDefinition } from "../views/diff-view";

const VISIBLE_VIEWS: ViewDefinition[] = [
	agentViewDefinition,
	filesViewDefinition,
	searchViewDefinition,
	tasksViewDefinition,
	checkpointViewDefinition,
	historyViewDefinition,
];

const HIDDEN_VIEWS: ViewDefinition[] = [
	markdownViewDefinition,
	commitViewDefinition,
	diffViewDefinition,
];

export const VIEW_DEFINITIONS: ViewDefinition[] = VISIBLE_VIEWS;

export const VIEW_MAP = new Map<ViewKey, ViewDefinition>(
	[...VISIBLE_VIEWS, ...HIDDEN_VIEWS].map((ext) => [ext.key, ext]),
);

let viewCounter = 0;

export function createViewInstanceKey(viewKey: ViewKey): string {
	viewCounter += 1;
	return `${viewKey}-${viewCounter}`;
}
