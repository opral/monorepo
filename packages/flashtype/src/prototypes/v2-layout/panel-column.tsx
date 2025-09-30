import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Plus, X } from "lucide-react";
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

	return (
		<aside className="flex w-[260px] min-w-[232px] max-w-[288px] flex-col text-[#3d4251]">
			<div className="flex min-h-0 flex-1 flex-col rounded-lg bg-white">
				<header className="rounded-t-lg border-b border-[#e3e6ef] bg-white px-3.5 py-3">
					<div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.12em] text-[#7a7f8f]">
						<span>{title}</span>
						<ToolPicker onAddTool={onAddTool} />
					</div>
					<nav className="mt-3 flex flex-wrap gap-2">
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
										className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] transition-colors ${
											isActive
												? "bg-[#f0f0f0] text-[#212430]"
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
										className="absolute -right-2 -top-2 hidden h-4 w-4 items-center justify-center rounded-full bg-[#ced2df] text-[#f6f7fb] shadow-sm group-hover:flex"
									>
										<X className="h-3 w-3" />
									</button>
								</div>
							);
						})}
						{panel.instances.length === 0 ? (
							<div className="bg-transparent px-3 py-2 text-[12px] text-[#7a7f8f]">
								No tools yet
							</div>
						) : null}
					</nav>
				</header>
				<div className="flex min-h-0 flex-1 flex-col px-3.5 py-3">
					{activeInstance && activeTool ? (
						<ToolPanel tool={activeTool} />
					) : (
						<div className="flex flex-1 items-center justify-center text-sm text-[#7a7f8f]">
							Add a tool to the {side} panel.
						</div>
					)}
				</div>
			</div>
		</aside>
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
