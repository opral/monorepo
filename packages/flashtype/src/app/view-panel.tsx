import type { ViewDefinition, ViewContext, ViewInstance } from "./types";

interface ViewPanelProps {
	readonly view: ViewDefinition;
	readonly context?: ViewContext;
	readonly viewInstance?: ViewInstance;
}

/**
 * Wraps the active view content.
 *
 * @example
 * <ViewPanel view={view} context={context} panelView={viewEntry} />
 */
export function ViewPanel({ view, context, viewInstance }: ViewPanelProps) {
	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-auto text-sm text-neutral-900">
			{view.render(context, viewInstance)}
		</div>
	);
}
