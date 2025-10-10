import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useDroppable } from "@dnd-kit/core";
import { useMemo } from "react";
import { ChevronDown, PanelLeft, PanelRight, Plus } from "lucide-react";
import type {
	PanelSide,
	PanelState,
	ViewKey,
	ViewContext,
	ViewDefinition,
} from "./types";
import { VIEW_DEFINITIONS, VIEW_MAP } from "./view-registry";
import { ViewPanel } from "./view-panel";
import { Panel } from "./panel";
import { KeepPreviousSuspense } from "@/components/keep-previous-suspense";

interface SidePanelProps {
	readonly side: PanelSide;
	readonly title: string;
	readonly panel: PanelState;
	readonly onSelectView: (instanceKey: string) => void;
	readonly onAddView: (toolId: ViewKey) => void;
	readonly onRemoveView: (instanceKey: string) => void;
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
	const activeEntry = panel.activeInstanceKey
		? (panel.views.find(
				(view) => view.instanceKey === panel.activeInstanceKey,
			) ?? null)
		: (panel.views[0] ?? null);

	const activeView = activeEntry
		? (VIEW_MAP.get(activeEntry.viewKey) ?? null)
		: null;

	const hasViews = panel.views.length > 0;

	const { setNodeRef, isOver } = useDroppable({
		id: `${side}-panel`,
		data: { panel: side },
	});

	const panelViewKeySignature = useMemo(() => {
		if (panel.views.length === 0) {
			return "";
		}
		const keys = panel.views.map((entry) => entry.viewKey).sort();
		return keys.join("|");
	}, [panel.views]);

	const availableViews = useMemo(() => {
		if (panelViewKeySignature === "") {
			return VIEW_DEFINITIONS;
		}
		const activeKeys = new Set(panelViewKeySignature.split("|"));
		return VIEW_DEFINITIONS.filter((view) => !activeKeys.has(view.key));
	}, [panelViewKeySignature]);
	const canAddMoreViews = availableViews.length > 0;

	const contextWithFocus: ViewContext | undefined = useMemo(() => {
		if (!viewContext) {
			return { isPanelFocused: isFocused };
		}
		if (viewContext.isPanelFocused === isFocused) {
			return viewContext;
		}
		return { ...viewContext, isPanelFocused: isFocused };
	}, [viewContext, isFocused]);

	return (
		<aside
			ref={setNodeRef}
			onClickCapture={() => onFocusPanel(side)}
			className="flex h-full w-full flex-col text-neutral-600"
		>
			<Panel className={isOver ? "ring-2 ring-brand-600 ring-inset" : ""}>
				{hasViews && (
					<Panel.TabBar>
						{panel.views.map((entry) => {
							const view = VIEW_MAP.get(entry.viewKey);
							if (!view) return null;
							const isActive = activeEntry?.instanceKey === entry.instanceKey;
							return (
								<Panel.Tab
									key={entry.instanceKey}
									icon={view.icon}
									label={view.label}
									isActive={isActive}
									isFocused={isFocused && isActive}
									onClick={() => onSelectView(entry.instanceKey)}
									onClose={() => onRemoveView(entry.instanceKey)}
									dragData={{
										instanceKey: entry.instanceKey,
										viewKey: entry.viewKey,
										fromPanel: side,
									}}
								/>
							);
						})}
						{canAddMoreViews && (
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
											key={ext.key}
											onSelect={() => onAddView(ext.key)}
											className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-900 focus:bg-neutral-100"
										>
											<ext.icon className="h-4 w-4" />
											<span>{ext.label}</span>
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>
						)}
					</Panel.TabBar>
				)}
				<Panel.Content
					className={
						activeEntry && activeView
							? "px-1.5 py-1"
							: "flex items-center justify-center"
					}
				>
					{activeEntry && activeView ? (
						<KeepPreviousSuspense>
							<ViewPanel
								view={activeView}
								context={contextWithFocus}
								viewInstance={activeEntry}
							/>
						</KeepPreviousSuspense>
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
	onAddView: (viewKey: ViewKey) => void;
	availableViews?: ViewDefinition[];
}

/**
 * Empty state displayed when a panel has no active views.
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
							key={ext.key}
							onSelect={() => onAddView(ext.key)}
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
