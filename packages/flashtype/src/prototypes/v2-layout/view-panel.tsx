import type { ViewDefinition, ViewContext, ViewInstance } from "./types";

interface ViewPanelProps {
	readonly view: ViewDefinition;
	readonly context?: ViewContext;
	readonly instance?: ViewInstance;
}

/**
 * Wraps the active view content.
 *
 * @example
 * <ViewPanel view={view} context={context} instance={instance} />
 */
export function ViewPanel({ view, context, instance }: ViewPanelProps) {
	return (
		<div className="flex min-h-0 flex-1 flex-col overflow-auto text-sm text-neutral-900">
			{view.render(context, instance)}
		</div>
	);
}
