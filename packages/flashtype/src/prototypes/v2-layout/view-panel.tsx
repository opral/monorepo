import type { ViewDefinition } from "./types";

interface ViewPanelProps {
	readonly view: ViewDefinition;
}

/**
 * Wraps the active view content.
 *
 * @example
 * <ViewPanel view={view} />
 */
export function ViewPanel({ view }: ViewPanelProps) {
	return (
		<div className="flex-1 overflow-auto text-sm text-onsurface-primary">
			{view.render()}
		</div>
	);
}
