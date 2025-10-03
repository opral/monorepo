import type { ViewDefinition, ViewContext, PanelView } from "./types";

interface ViewPanelProps {
	readonly view: ViewDefinition;
	readonly context?: ViewContext;
	readonly panelView?: PanelView;
}

/**
 * Wraps the active view content.
 *
 * @example
 * <ViewPanel view={view} context={context} panelView={viewEntry} />
 */
export function ViewPanel({ view, context, panelView }: ViewPanelProps) {
	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-auto text-sm text-neutral-900">
			{view.render(context, panelView)}
		</div>
	);
}
