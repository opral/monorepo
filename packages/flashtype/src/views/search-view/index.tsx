import { Search } from "lucide-react";
import { createReactViewDefinition } from "../../app/react-view";

/**
 * Search view - Quickly locate files, symbols, or commands
 */
export function SearchView() {
	return (
		<div className="flex min-h-0 flex-1 flex-col space-y-3 px-3 py-2 text-sm text-neutral-900">
			<label className="grid gap-1 text-xs font-medium text-neutral-600">
				Query
				<input
					placeholder="Search project..."
					data-testid="search-view-input"
					className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-50"
				/>
			</label>
			<div className="space-y-1">
				<div className="text-xs uppercase tracking-[0.08em] text-neutral-400">
					Suggestions
				</div>
				<ul className="space-y-1">
					<li className="rounded-md px-2 py-1 hover:bg-neutral-100">
						Show recently edited files
					</li>
					<li className="rounded-md px-2 py-1 hover:bg-neutral-100">
						Find TODO annotations
					</li>
					<li className="rounded-md px-2 py-1 hover:bg-neutral-100">
						Open flashtype config
					</li>
				</ul>
			</div>
		</div>
	);
}

/**
 * Search panel view definition used by the registry.
 *
 * @example
 * import { view as searchView } from "@/views/search-view";
 */
export const view = createReactViewDefinition({
	key: "search",
	label: "Search",
	description: "Quickly locate files, symbols, or commands.",
	icon: Search,
	component: () => <SearchView />,
});
