import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { Bell, Command, GitBranch, PanelLeft, PanelRight, Search, Zap } from "lucide-react";

/**
 * Fleet-inspired top chrome with window controls and quick actions.
 *
 * @example
 * <TopBar />
 */
export function TopBar() {
	const navigate = useNavigate();

	return (
		<header className="flex h-10 items-center px-2">
			<div className="flex flex-1 items-center gap-1 text-sm text-[#5a6070]">
				<div className="flex h-7 w-7 items-center justify-center">
					<Zap className="h-4 w-4 text-amber-500" />
				</div>
				<Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#f0f0f0] hover:text-[#212430]">
					<PanelLeft className="h-4 w-4" />
				</Button>
				<Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#f0f0f0] hover:text-[#212430]">
					<PanelRight className="h-4 w-4" />
				</Button>
				<span className="flex items-center gap-1 rounded-md bg-[#e8eaf2] px-1.5 py-0.5 text-xs font-medium text-[#33384a]">
					<GitBranch className="h-3.5 w-3.5" />
					main
				</span>
			</div>
			<div className="flex items-center gap-0.5 text-[#5a6070]">
				<Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#f0f0f0] hover:text-[#212430]">
					<Search className="h-4 w-4" />
				</Button>
				<Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#f0f0f0] hover:text-[#212430]">
					<Command className="h-4 w-4" />
				</Button>
				<Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-[#f0f0f0] hover:text-[#212430]">
					<Bell className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className="h-7 px-2 text-xs text-[#5a6070] hover:bg-[#f0f0f0] hover:text-[#212430]"
					onClick={() => void navigate({ to: "/" })}
				>
					Back to main UI
				</Button>
			</div>
		</header>
	);
}
