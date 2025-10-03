import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useDroppable } from "@dnd-kit/core";
import { ChevronDown, PanelLeft, PanelRight, Plus } from "lucide-react";
import type {
	PanelSide,
	PanelState,
	ViewId,
	ViewContext,
	ViewDefinition,
} from "./types";
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
	readonly viewContext?: ViewContext;
	readonly isFocused: boolean;
	readonly onFocusPanel: (side: PanelSide) => void;
}

/**
 * Renders a side panel with its nav and active content.
 *
 * @example
 * <SidePanel side="left" title="Left" panel={panelState} ... />
 */

export function SidePanel({
	side,
	title: _unusedTitle,
	panel,
	onSelectView,
	onAddView,
	onRemoveView,
	viewContext,
	isFocused,
	onFocusPanel,
}: SidePanelProps) {
	const activeInstance = panel.activeInstanceId
		? (panel.instances.find(
				(instance) => instance.instanceId === panel.activeInstanceId,
			) ?? null)
		: (panel.instances[0] ?? null);

	const activeView = activeInstance
		? (VIEW_MAP.get(activeInstance.viewId) ?? null)
		: null;

	const hasViews = panel.instances.length > 0;

	const { setNodeRef, isOver } = useDroppable({
		id: `${side}-panel`,
		data: { panel: side },
	});

	const availableViews = VIEW_DEFINITIONS.filter(
		(view) => !panel.instances.some((instance) => instance.viewId === view.id),
	);

	const contextWithFocus: ViewContext | undefined = viewContext
		? { ...viewContext, isPanelFocused: isFocused }
		: { isPanelFocused: isFocused };

	return (
		<aside
			ref={setNodeRef}
			onClickCapture={() => onFocusPanel(side)}
			className="flex h-full w-full flex-col text-neutral-600"
		>
			<Panel className={isOver ? "ring-2 ring-brand-600 ring-inset" : ""}>
				{hasViews && (
					<Panel.TabBar>
						{panel.instances.map((instance) => {
							const view = VIEW_MAP.get(instance.viewId);
							if (!view) return null;
							const isActive =
								activeInstance?.instanceId === instance.instanceId;
							return (
								<Panel.Tab
									key={instance.instanceId}
									icon={view.icon}
									label={view.label}
									isActive={isActive}
									isFocused={isFocused && isActive}
									onClick={() => onSelectView(instance.instanceId)}
									onClose={() => onRemoveView(instance.instanceId)}
									dragData={{
										instanceId: instance.instanceId,
										viewId: instance.viewId,
										fromPanel: side,
									}}
								/>
							);
						})}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									title="Add view"
									className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-600 hover:bg-neutral-100"
								>
									<Plus className="h-4 w-4" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align={side === "left" ? "start" : "end"}
								className="w-40 border border-neutral-100 bg-neutral-0 p-1 shadow-lg"
							>
								{availableViews.map((ext) => (
									<DropdownMenuItem
										key={ext.id}
										onSelect={() => onAddView(ext.id)}
										className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-900 focus:bg-neutral-100"
									>
										<ext.icon className="h-4 w-4" />
										<span>{ext.label}</span>
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</Panel.TabBar>
				)}
				<Panel.Content
					className={
						activeInstance && activeView
							? "px-1.5 py-1"
							: "flex items-center justify-center"
					}
				>
					{activeInstance && activeView ? (
						<ViewPanel
							view={activeView}
							context={contextWithFocus}
							instance={activeInstance}
						/>
					) : (
						<EmptyPanelState
							side={side}
							onAddView={onAddView}
							availableViews={availableViews}
						/>
					)}
				</Panel.Content>
			</Panel>
		</aside>
	);
}

interface EmptyPanelStateProps {
	side: PanelSide;
	onAddView: (viewId: ViewId) => void;
	availableViews?: ViewDefinition[];
}

/**
 * Fleet-style empty state for panels with no active views
 */
function EmptyPanelState({
	side,
	onAddView,
	availableViews,
}: EmptyPanelStateProps) {
	const Icon = side === "left" ? PanelLeft : PanelRight;
	const panelName = side === "left" ? "Left" : "Right";
	const menuViews = availableViews ?? VIEW_DEFINITIONS;

	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
			<Icon className="h-12 w-12 text-neutral-600" strokeWidth={1.5} />
			<div className="space-y-1">
				<div className="text-sm font-medium text-neutral-900">
					{panelName} Panel
				</div>
				<div className="text-xs text-neutral-600 max-w-[200px]">
					Add a new view or drag-n-drop a view from the other panels
				</div>
			</div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="outline"
						size="sm"
						className="gap-1 border-neutral-200 text-xs text-neutral-600 hover:bg-neutral-100"
					>
						Open View
						<ChevronDown className="h-3 w-3" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="center"
					className="w-40 border border-neutral-100 bg-neutral-0 p-1 shadow-lg"
				>
					{menuViews.map((ext) => (
						<DropdownMenuItem
							key={ext.id}
							onSelect={() => onAddView(ext.id)}
							className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-900 focus:bg-neutral-100"
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
