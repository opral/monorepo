import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { Bell, Command, GitBranch, Search } from "lucide-react";

/**
 * Fleet-inspired top chrome with window controls and quick actions.
 *
 * @example
 * <TopBar />
 */
export function TopBar() {
	const navigate = useNavigate();

	return (
		<header className="flex h-12 items-center border-b border-[#d9dce3] bg-[#f8f9fb] px-5">
			<div className="flex flex-1 items-center gap-3 text-sm text-[#5a6070]">
				<span className="font-medium text-[#212430]">flashtype-mock</span>
				<span className="flex items-center gap-1 rounded-md bg-[#e8eaf2] px-2 py-1 text-xs font-medium text-[#33384a]">
					<GitBranch className="h-3.5 w-3.5" />
					main
				</span>
			</div>
			<div className="flex items-center gap-1.5 text-[#5a6070]">
				<Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-[#edeff5] hover:text-[#212430]">
					<Search className="h-4 w-4" />
				</Button>
				<Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-[#edeff5] hover:text-[#212430]">
					<Command className="h-4 w-4" />
				</Button>
				<Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-[#edeff5] hover:text-[#212430]">
					<Bell className="h-4 w-4" />
				</Button>
				<Button
					variant="ghost"
					size="sm"
					className="h-8 rounded-md px-3 text-xs text-[#5a6070] hover:bg-[#edeff5] hover:text-[#212430]"
					onClick={() => void navigate({ to: "/" })}
				>
					Back to main UI
				</Button>
			</div>
		</header>
	);
}
