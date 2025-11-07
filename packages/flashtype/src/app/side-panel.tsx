import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { ChevronDown, PanelLeft, PanelRight, Plus } from "lucide-react";
import type {
	PanelSide,
	PanelState,
	ViewKey,
	ViewContext,
	ViewDefinition,
} from "./types";
import { VIEW_DEFINITIONS } from "./view-registry";
import { PanelV2 } from "./panel-v2";

interface SidePanelProps {
	readonly side: PanelSide;
	readonly title: string;
	readonly panel: PanelState;
	readonly onSelectView: (instanceKey: string) => void;
	readonly onAddView: (toolId: ViewKey) => void;
	readonly onRemoveView: (instanceKey: string) => void;
	readonly viewContext: ViewContext;
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

	const addViewButton = canAddMoreViews ? (
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
	) : null;

	return (
		<PanelV2
			side={side}
			panel={panel}
			isFocused={isFocused}
			onFocusPanel={onFocusPanel}
			onSelectView={onSelectView}
			onRemoveView={onRemoveView}
			viewContext={viewContext}
			tabLabel={(view) => view.label}
			extraTabBarContent={addViewButton}
			emptyStatePlaceholder={
				<EmptyPanelState
					side={side}
					onAddView={onAddView}
					availableViews={availableViews}
				/>
			}
		/>
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
