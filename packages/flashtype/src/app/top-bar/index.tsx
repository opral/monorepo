import { Button } from "@/components/ui/button";
import {
	Bell,
	Command,
	GitBranch,
	PanelLeft,
	PanelRight,
	Search,
} from "lucide-react";
import { FlashtypeMenu } from "./flashtype-menu";

/**
 * Top navigation with window controls, quick actions, and app menu.
 *
 * @example
 * <TopBar />
 */
export function TopBar() {
	return (
		<header className="flex h-10 items-center px-2 text-neutral-600">
			<div className="flex flex-1 items-center gap-1 text-sm">
				<FlashtypeMenu />
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 rounded-md hover:bg-neutral-200 hover:text-neutral-900"
				>
					<PanelLeft className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 rounded-md hover:bg-neutral-200 hover:text-neutral-900"
				>
					<PanelRight className="h-4 w-4" />
				</Button>
				<span className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-neutral-900">
					<GitBranch className="h-3.5 w-3.5" />
					main
				</span>
			</div>
			<div className="flex items-center gap-0.5">
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 rounded-md hover:bg-neutral-200 hover:text-neutral-900"
				>
					<Search className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 rounded-md hover:bg-neutral-200 hover:text-neutral-900"
				>
					<Command className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 rounded-md hover:bg-neutral-200 hover:text-neutral-900"
				>
					<Bell className="h-4 w-4" />
				</Button>
			</div>
		</header>
	);
}
