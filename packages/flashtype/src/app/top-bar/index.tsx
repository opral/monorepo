import { Button } from "@/components/ui/button";
import { Bell, Command, GitBranch, Search } from "lucide-react";
import { FlashtypeMenu } from "./flashtype-menu";

export type TopBarProps = {
	readonly onToggleLeftSidebar?: () => void;
	readonly onToggleRightSidebar?: () => void;
	readonly isLeftSidebarVisible?: boolean;
	readonly isRightSidebarVisible?: boolean;
};

/**
 * Top navigation with window controls, quick actions, and app menu.
 *
 * @example
 * <TopBar
 *   onToggleLeftSidebar={handleLeftToggle}
 *   onToggleRightSidebar={handleRightToggle}
 *   isLeftSidebarVisible={leftVisible}
 *   isRightSidebarVisible={rightVisible}
 * />
 */
export function TopBar({
	onToggleLeftSidebar,
	onToggleRightSidebar,
	isLeftSidebarVisible = true,
	isRightSidebarVisible = true,
}: TopBarProps) {
	return (
		<header className="flex h-10 items-center px-2 text-neutral-600">
			<div className="flex flex-1 items-center gap-1 text-sm">
				<FlashtypeMenu />
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 rounded-md hover:bg-neutral-200 hover:text-neutral-900"
					type="button"
					onClick={onToggleLeftSidebar}
					title="Toggle left sidebar"
					aria-label="Toggle left sidebar"
					aria-pressed={isLeftSidebarVisible}
					data-state={isLeftSidebarVisible ? "on" : "off"}
				>
					<PanelToggleIcon side="left" isActive={isLeftSidebarVisible} />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 rounded-md hover:bg-neutral-200 hover:text-neutral-900"
					type="button"
					onClick={onToggleRightSidebar}
					title="Toggle right sidebar"
					aria-label="Toggle right sidebar"
					aria-pressed={isRightSidebarVisible}
					data-state={isRightSidebarVisible ? "on" : "off"}
				>
					<PanelToggleIcon side="right" isActive={isRightSidebarVisible} />
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

type PanelToggleIconProps = {
	readonly side: "left" | "right";
	readonly isActive: boolean;
};

function PanelToggleIcon({ side, isActive }: PanelToggleIconProps) {
	const viewBoxPath = side === "left" ? "M9 3v18" : "M15 3v18";
	const panelRect = side === "left" ? { x: 3, width: 6 } : { x: 15, width: 6 };
	return (
		<svg
			aria-hidden="true"
			className="h-4 w-4 text-current"
			focusable="false"
			role="img"
			viewBox="0 0 24 24"
		>
			{isActive ? (
				<rect
					{...panelRect}
					y="3"
					height="18"
					rx="1.2"
					fill="currentColor"
					fillOpacity={0.45}
				/>
			) : null}
			<rect
				width="18"
				height="18"
				x="3"
				y="3"
				rx="2"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d={viewBoxPath}
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
