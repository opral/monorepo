import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, PanelLeft, PanelRight, Plus } from "lucide-react";
import type { PanelSide, PanelState, ViewId } from "./types";
import { VIEW_DEFINITIONS, VIEW_MAP } from "./view-registry";
import { ViewPanel } from "./view-panel";
import { Panel } from "./panel";

interface SidePanelProps {
	readonly side: PanelSide;
	readonly title: string;
	readonly panel: PanelState;
	readonly onSelectView: (instanceId: string) => void;
	readonly onAddView: (toolId: ViewId) => void;
	readonly onRemoveView: (instanceId: string) => void;
}

/**
 * Renders a side panel with its nav and active content.
 *
 * @example
 * <SidePanel side="left" title="Left" panel={panelState} ... />
 */

export function SidePanel({
	side,
	title,
	panel,
	onSelectView,
	onAddView,
	onRemoveView,
}: SidePanelProps) {
	const activeInstance = panel.activeInstanceId
		? panel.instances.find((instance) => instance.instanceId === panel.activeInstanceId) ?? null
		: panel.instances[0] ?? null;

	const activeView = activeInstance ? VIEW_MAP.get(activeInstance.viewId) ?? null : null;

	const hasViews = panel.instances.length > 0;

	return (
		<aside className="flex w-[260px] min-w-[232px] max-w-[288px] flex-col text-onsurface-secondary">
			<Panel>
				{hasViews && (
					<Panel.TabBar>
						{panel.instances.map((instance) => {
							const view = VIEW_MAP.get(instance.viewId);
							if (!view) return null;
							const isActive = activeInstance?.instanceId === instance.instanceId;
							return (
								<Panel.Tab
									key={instance.instanceId}
									icon={view.icon}
									label={view.label}
									isActive={isActive}
									isFocused={false}
									onClick={() => onSelectView(instance.instanceId)}
									onClose={() => onRemoveView(instance.instanceId)}
								/>
							);
						})}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									title="Add view"
									className="flex h-7 w-7 items-center justify-center rounded-md text-onsurface-secondary hover:bg-surface-300"
								>
									<Plus className="h-4 w-4" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align={side === "left" ? "start" : "end"} className="w-40 border border-stroke-100 bg-surface-100 p-1 shadow-lg">
								{VIEW_DEFINITIONS.map((ext) => (
									<DropdownMenuItem
										key={ext.id}
										onSelect={() => onAddView(ext.id)}
									className="flex items-center gap-2 px-3 py-1.5 text-sm text-onsurface-primary focus:bg-surface-300"
									>
										<ext.icon className="h-4 w-4" />
										<span>{ext.label}</span>
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</Panel.TabBar>
				)}
				<Panel.Content className={activeInstance && activeView ? "px-1.5 py-1" : "flex items-center justify-center"}>
					{activeInstance && activeView ? (
						<ViewPanel view={activeView} />
					) : (
		<EmptyPanelState side={side} onAddView={onAddView} />
					)}
				</Panel.Content>
			</Panel>
		</aside>
	);
}

interface EmptyPanelStateProps {
	side: PanelSide;
	onAddView: (viewId: ViewId) => void;
}

/**
 * Fleet-style empty state for panels with no active views
 */
function EmptyPanelState({ side, onAddView }: EmptyPanelStateProps) {
	const Icon = side === "left" ? PanelLeft : PanelRight;
	const panelName = side === "left" ? "Left" : "Right";

	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
			<Icon className="h-12 w-12 text-stroke-200" strokeWidth={1.5} />
			<div className="space-y-1">
				<div className="text-base font-medium text-onsurface-primary">{panelName} Panel</div>
				<div className="text-sm text-onsurface-tertiary max-w-[200px]">
					Add a new view or drag-n-drop a view from the other panels
				</div>
			</div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="outline"
						size="sm"
						className="gap-1 border-stroke-200 text-xs text-onsurface-secondary hover:bg-surface-300"
					>
						Open View
						<ChevronDown className="h-3 w-3" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="center" className="w-40 border border-stroke-100 bg-surface-100 p-1 shadow-lg">
					{VIEW_DEFINITIONS.map((ext) => (
						<DropdownMenuItem
							key={ext.id}
							onSelect={() => onAddView(ext.id)}
							className="flex items-center gap-2 px-3 py-1.5 text-sm text-onsurface-primary focus:bg-surface-300"
						>
							<ext.icon className="h-4 w-4" />
							<span>{ext.label}</span>
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
