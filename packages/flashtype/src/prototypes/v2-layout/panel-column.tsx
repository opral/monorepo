import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, PanelLeft, PanelRight, Plus, X } from "lucide-react";
import type { PanelSide, PanelState, ViewId } from "./types";
import { VIEW_DEFINITIONS, VIEW_MAP } from "./view-registry";
import { ViewPanel } from "./view-panel";

interface PanelColumnProps {
	readonly side: PanelSide;
	readonly title: string;
	readonly panel: PanelState;
	readonly onSelectView: (instanceId: string) => void;
	readonly onAddView: (toolId: ViewId) => void;
	readonly onRemoveView: (instanceId: string) => void;
}

/**
 * Renders a single tool island with its nav and active content.
 *
 * @example
 * <PanelColumn side="left" title="Left" panel={panelState} ... />
 */

export function PanelColumn({
	side,
	title,
	panel,
	onSelectView,
	onAddView,
	onRemoveView,
}: PanelColumnProps) {
	const activeInstance = panel.activeInstanceId
		? panel.instances.find((instance) => instance.instanceId === panel.activeInstanceId) ?? null
		: panel.instances[0] ?? null;

	const activeView = activeInstance ? VIEW_MAP.get(activeInstance.viewId) ?? null : null;

	const hasViews = panel.instances.length > 0;

	return (
		<aside className="flex w-[260px] min-w-[232px] max-w-[288px] flex-col text-[#3d4251]">
			<div className="flex min-h-0 flex-1 flex-col rounded-lg bg-white">
				{hasViews && (
					<header className="flex items-center gap-1 rounded-t-lg bg-white px-2 py-2">
						{panel.instances.map((instance) => {
							const view = VIEW_MAP.get(instance.viewId);
							if (!view) return null;
							const isActive = activeInstance?.instanceId === instance.instanceId;
							return (
								<div key={instance.instanceId} className="group relative">
									<button
										type="button"
										onClick={() => onSelectView(instance.instanceId)}
										title={`${view.label} (${side})`}
										className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] transition-colors ${
											isActive
												? "bg-[#f0f0f0] font-semibold text-[#212430]"
												: "bg-transparent text-[#4d5361] hover:bg-[#f8f8f8]"
										}`}
									>
										<view.icon className="h-3.5 w-3.5" />
										<span>{view.label}</span>
									</button>
									<button
										type="button"
										onClick={() => onRemoveView(instance.instanceId)}
										title={`Close ${view.label}`}
										className="absolute -right-1 -top-1 hidden h-3.5 w-3.5 items-center justify-center rounded-full bg-[#ced2df] text-[#f6f7fb] shadow-sm group-hover:flex"
									>
										<X className="h-2.5 w-2.5" />
									</button>
								</div>
							);
						})}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									title="Add view"
									className="flex h-7 w-7 items-center justify-center rounded-md text-[#4d5361] hover:bg-[#f0f0f0]"
								>
									<Plus className="h-4 w-4" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align={side === "left" ? "start" : "end"} className="w-40 border border-[#e0e0e0] bg-white p-1 shadow-lg">
								{VIEW_DEFINITIONS.map((ext) => (
									<DropdownMenuItem
										key={ext.id}
										onSelect={() => onAddView(ext.id)}
										className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#2d3140] focus:bg-[#f0f0f0]"
									>
										<ext.icon className="h-4 w-4" />
										<span>{ext.label}</span>
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</header>
				)}
				<div className="flex min-h-0 flex-1 flex-col px-3.5 py-3">
					{activeInstance && activeView ? (
						<ViewPanel view={activeView} />
					) : (
						<EmptyPanelState side={side} onAddView={onAddView} />
					)}
				</div>
			</div>
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
			<Icon className="h-12 w-12 text-[#d0d0d0]" strokeWidth={1.5} />
			<div className="space-y-1">
				<div className="text-base font-medium text-[#2d3140]">{panelName} Panel</div>
				<div className="text-sm text-[#7a7f8f] max-w-[200px]">
					Add a new view or drag-n-drop a view from the other panels
				</div>
			</div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="outline"
						size="sm"
						className="gap-1 border-[#d0d0d0] text-xs text-[#4d5361] hover:bg-[#f0f0f0]"
					>
						Open View
						<ChevronDown className="h-3 w-3" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="center" className="w-40 border border-[#e0e0e0] bg-white p-1 shadow-lg">
					{VIEW_DEFINITIONS.map((ext) => (
						<DropdownMenuItem
							key={ext.id}
							onSelect={() => onAddView(ext.id)}
							className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#2d3140] focus:bg-[#f0f0f0]"
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

interface ViewPickerProps {
	onAddView: (toolId: ViewId) => void;
}

/**
 * Dropdown menu that exposes the available tools for the panel.
 *
 * @example
 * <ViewPicker onAddView={handleAdd} />
 */
function ViewPicker({ onAddView }: ViewPickerProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="h-7 gap-1 px-2.5 text-xs font-medium text-[#4d5361] hover:bg-[#f0f0f0]"
				>
					<Plus className="h-3.5 w-3.5" />
					Add
					<ChevronDown className="h-3 w-3" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48 border border-[#e0e0e0] bg-white p-1 shadow-lg">
				{VIEW_DEFINITIONS.map((tool) => (
					<DropdownMenuItem
						key={tool.id}
						onSelect={() => onAddView(tool.id)}
						className="flex items-start gap-2 px-2 py-2 text-sm text-[#2d3140] focus:bg-[#f0f0f0]"
					>
						<view.icon className="mt-[2px] h-4 w-4" />
						<div>
							<div className="text-sm font-medium text-[#212430]">{view.label}</div>
							<div className="text-xs text-[#7a7f8f]">{view.description}</div>
						</div>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
