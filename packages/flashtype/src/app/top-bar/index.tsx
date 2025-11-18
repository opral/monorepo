import { useId } from "react";
import { AlertTriangle } from "lucide-react";
import { useQueryTakeFirst } from "@lix-js/react-utils";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { FlashtypeMenu } from "./flashtype-menu";
import { VersionSwitcher } from "./version-switcher";

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
	const alphaDescriptionId = useId();
	const fileCount = useQueryTakeFirst(({ lix }) =>
		lix.db
			.selectFrom("file")
			.select(({ fn }) => [fn.count<number>("id").as("count")])
			.where("path", "is not", "/AGENTS.md"),
	);

	const hasFiles = (fileCount?.count ?? 0) > 0;

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
				<VersionSwitcher />
			</div>
			<div className="flex flex-1 justify-center">
				{hasFiles ? (
					<Popover>
						<PopoverTrigger asChild>
							<button
								type="button"
								className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-neutral-200 px-3 py-1 text-xs font-medium text-neutral-700 transition hover:bg-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
								aria-describedby={alphaDescriptionId}
							>
								<AlertTriangle className="h-3.5 w-3.5" aria-hidden />
								<span>
									Flashtype is in alpha, back up your files regularly.
								</span>
							</button>
						</PopoverTrigger>
						<PopoverContent className="w-80 text-sm" sideOffset={8}>
							<div className="flex flex-col gap-4" id={alphaDescriptionId}>
								<div>
									<p className="font-medium text-foreground">
										Flashtype is in alpha.
									</p>
									<p className="text-muted-foreground">
										Breaking changes may occur at any time. Please share
										feedback so we can improve the experience.
									</p>
								</div>
								<div className="flex items-center gap-2 text-xs">
									<a
										className="text-primary underline-offset-4 hover:underline"
										href="https://github.com/opral/flashtype/issues"
										target="_blank"
										rel="noreferrer"
									>
										Report an issue
									</a>
									<span aria-hidden>·</span>
									<a
										className="text-primary underline-offset-4 hover:underline"
										href="https://discord.gg/StVekJpyBp"
										target="_blank"
										rel="noreferrer"
									>
										Join the community
									</a>
								</div>
							</div>
						</PopoverContent>
					</Popover>
				) : null}
			</div>
			<div className="flex flex-1 items-center justify-end gap-0.5">
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 rounded-md hover:bg-neutral-200 hover:text-neutral-900"
					asChild
				>
					<a
						href="https://github.com/opral/flashtype"
						target="_blank"
						rel="noreferrer"
						title="GitHub"
					>
						<svg
							className="h-4 w-4"
							fill="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path
								fillRule="evenodd"
								d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
								clipRule="evenodd"
							/>
						</svg>
					</a>
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-7 w-7 rounded-md hover:bg-neutral-200 hover:text-neutral-900"
					asChild
				>
					<a
						href="https://discord.gg/StVekJpyBp"
						target="_blank"
						rel="noreferrer"
						title="Discord"
					>
						<svg
							className="h-4 w-4"
							fill="currentColor"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
						</svg>
					</a>
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
