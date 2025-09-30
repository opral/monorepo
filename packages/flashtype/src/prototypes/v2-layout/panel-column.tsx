import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, PanelLeft, PanelRight, Plus, X } from "lucide-react";
import type { PanelSide, PanelState, ToolId } from "./types";
import { TOOL_DEFINITIONS, TOOL_MAP } from "./tool-registry";
import { ToolPanel } from "./tool-panel";

interface PanelColumnProps {
	readonly side: PanelSide;
	readonly title: string;
	readonly panel: PanelState;
	readonly onSelectTool: (instanceId: string) => void;
	readonly onAddTool: (toolId: ToolId) => void;
	readonly onRemoveTool: (instanceId: string) => void;
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
	onSelectTool,
	onAddTool,
	onRemoveTool,
}: PanelColumnProps) {
	const activeInstance = panel.activeInstanceId
		? panel.instances.find((instance) => instance.instanceId === panel.activeInstanceId) ?? null
		: panel.instances[0] ?? null;

	const activeTool = activeInstance ? TOOL_MAP.get(activeInstance.toolId) ?? null : null;

	const hasTools = panel.instances.length > 0;

	return (
		<aside className="flex w-[260px] min-w-[232px] max-w-[288px] flex-col text-[#3d4251]">
			<div className="flex min-h-0 flex-1 flex-col rounded-lg bg-white">
				{hasTools && (
					<header className="flex items-center gap-1 rounded-t-lg bg-white px-2 py-2">
						{panel.instances.map((instance) => {
							const tool = TOOL_MAP.get(instance.toolId);
							if (!tool) return null;
							const isActive = activeInstance?.instanceId === instance.instanceId;
							return (
								<div key={instance.instanceId} className="group relative">
									<button
										type="button"
										onClick={() => onSelectTool(instance.instanceId)}
										title={`${tool.label} (${side})`}
										className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] transition-colors ${
											isActive
												? "bg-[#f0f0f0] font-semibold text-[#212430]"
												: "bg-transparent text-[#4d5361] hover:bg-[#f8f8f8]"
										}`}
									>
										<tool.icon className="h-3.5 w-3.5" />
										<span>{tool.label}</span>
									</button>
									<button
										type="button"
										onClick={() => onRemoveTool(instance.instanceId)}
										title={`Close ${tool.label}`}
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
									title="Add tool"
									className="flex h-7 w-7 items-center justify-center rounded-md text-[#4d5361] hover:bg-[#f0f0f0]"
								>
									<Plus className="h-4 w-4" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end" className="w-48 border border-[#e0e0e0] bg-white p-1 shadow-lg">
								{TOOL_DEFINITIONS.map((tool) => (
									<DropdownMenuItem
										key={tool.id}
										onSelect={() => onAddTool(tool.id)}
										className="flex items-start gap-2 px-2 py-2 text-sm text-[#2d3140] focus:bg-[#f0f0f0]"
									>
										<tool.icon className="mt-[2px] h-4 w-4" />
										<div>
											<div className="text-sm font-medium text-[#212430]">{tool.label}</div>
											<div className="text-xs text-[#7a7f8f]">{tool.description}</div>
										</div>
									</DropdownMenuItem>
								))}
							</DropdownMenuContent>
						</DropdownMenu>
					</header>
				)}
				<div className="flex min-h-0 flex-1 flex-col px-3.5 py-3">
					{activeInstance && activeTool ? (
						<ToolPanel tool={activeTool} />
					) : (
						<EmptyPanelState side={side} onAddTool={onAddTool} />
					)}
				</div>
			</div>
		</aside>
	);
}

interface EmptyPanelStateProps {
	side: PanelSide;
	onAddTool: (toolId: ToolId) => void;
}

/**
 * Fleet-style empty state for panels with no active tools
 */
function EmptyPanelState({ side, onAddTool }: EmptyPanelStateProps) {
	const Icon = side === "left" ? PanelLeft : PanelRight;
	const panelName = side === "left" ? "Left" : "Right";

	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
			<Icon className="h-12 w-12 text-[#d0d0d0]" strokeWidth={1.5} />
			<div className="space-y-1">
				<div className="text-base font-medium text-[#2d3140]">{panelName} Panel</div>
				<div className="text-sm text-[#7a7f8f] max-w-[200px]">
					Add a new tool or drag-n-drop a tool from the other panels
				</div>
			</div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="outline"
						size="sm"
						className="gap-1 border-[#d0d0d0] text-xs text-[#4d5361] hover:bg-[#f0f0f0]"
					>
						Add Tool
						<ChevronDown className="h-3 w-3" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="center" className="w-40 border border-[#e0e0e0] bg-white p-1 shadow-lg">
					{TOOL_DEFINITIONS.map((tool) => (
						<DropdownMenuItem
							key={tool.id}
							onSelect={() => onAddTool(tool.id)}
							className="flex items-start gap-2 px-2 py-2 text-sm text-[#2d3140] focus:bg-[#f0f0f0]"
						>
							<tool.icon className="mt-[2px] h-4 w-4" />
							<div>
								<div className="text-sm font-medium text-[#212430]">{tool.label}</div>
								<div className="text-xs text-[#7a7f8f]">{tool.description}</div>
							</div>
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

interface ToolPickerProps {
	onAddTool: (toolId: ToolId) => void;
}

/**
 * Dropdown menu that exposes the available tools for the panel.
 *
 * @example
 * <ToolPicker onAddTool={handleAdd} />
 */
function ToolPicker({ onAddTool }: ToolPickerProps) {
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
				{TOOL_DEFINITIONS.map((tool) => (
					<DropdownMenuItem
						key={tool.id}
						onSelect={() => onAddTool(tool.id)}
						className="flex items-start gap-2 px-2 py-2 text-sm text-[#2d3140] focus:bg-[#f0f0f0]"
					>
						<tool.icon className="mt-[2px] h-4 w-4" />
						<div>
							<div className="text-sm font-medium text-[#212430]">{tool.label}</div>
							<div className="text-xs text-[#7a7f8f]">{tool.description}</div>
						</div>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
