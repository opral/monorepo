import { useMemo, useState } from "react";
import { PanelColumn } from "./panel-column";
import { Workspace } from "./workspace";
import { TopBar } from "./top-bar";
import { StatusBar } from "./status-bar";
import type { PanelSide, PanelState, ToolId } from "./types";
import { createToolInstanceId } from "./tool-registry";

/**
 * Fleet-style layout shell with independent left and right islands.
 *
 * @example
 * <V2LayoutShell />
 */
export function V2LayoutShell() {
	const [leftPanel, setLeftPanel] = useState<PanelState>(() => ({
		instances: [
			{ instanceId: createToolInstanceId("files"), toolId: "files" },
			{ instanceId: createToolInstanceId("search"), toolId: "search" },
		],
		activeInstanceId: null,
	}));
	const [rightPanel, setRightPanel] = useState<PanelState>(() => ({
		instances: [{ instanceId: createToolInstanceId("assistant"), toolId: "assistant" }],
		activeInstanceId: null,
	}));

	const panels = useMemo(
		() => ({ left: leftPanel, right: rightPanel }),
		[leftPanel, rightPanel],
	);

	const hydrate = (panel: PanelState): PanelState => ({
		instances: panel.instances,
		activeInstanceId:
			panel.instances.length === 0
				? null
				: panel.activeInstanceId ?? panel.instances[0]?.instanceId ?? null,
	});

	const setPanelState = (side: PanelSide, reducer: (state: PanelState) => PanelState) => {
		if (side === "left") {
			setLeftPanel((prev) => reducer(hydrate(prev)));
		} else {
			setRightPanel((prev) => reducer(hydrate(prev)));
		}
	};

	const hydratedLeft = hydrate(panels.left);
	const hydratedRight = hydrate(panels.right);

	return (
		<div className="flex min-h-screen flex-col bg-[#f6f7fb] text-[#212430]">
			<TopBar />
			<div className="flex min-h-0 flex-1 gap-2 px-2 py-2">
				<PanelColumn
					side="left"
					title="Navigator"
					panel={hydratedLeft}
					onSelectTool={(instanceId) =>
						setPanelState("left", (panel) => ({
							instances: panel.instances,
							activeInstanceId: instanceId,
						}))
					}
					onAddTool={(toolId) =>
						setPanelState("left", (panel) => {
							const next = {
								instanceId: createToolInstanceId(toolId),
								toolId,
							};
							return {
								instances: [...panel.instances, next],
								activeInstanceId: next.instanceId,
							};
						})
					}
					onRemoveTool={(instanceId) =>
						setPanelState("left", (panel) => {
							const instances = panel.instances.filter((entry) => entry.instanceId !== instanceId);
							const nextActive = panel.activeInstanceId === instanceId
								? instances[instances.length - 1]?.instanceId ?? null
								: panel.activeInstanceId;
							return { instances, activeInstanceId: nextActive };
						})
					}
				/>
				<Workspace />
				<PanelColumn
					side="right"
					title="Secondary"
					panel={hydratedRight}
					onSelectTool={(instanceId) =>
						setPanelState("right", (panel) => ({
							instances: panel.instances,
							activeInstanceId: instanceId,
						}))
					}
					onAddTool={(toolId) =>
						setPanelState("right", (panel) => {
							const next = {
								instanceId: createToolInstanceId(toolId),
								toolId,
							};
							return {
								instances: [...panel.instances, next],
								activeInstanceId: next.instanceId,
							};
						})
					}
					onRemoveTool={(instanceId) =>
						setPanelState("right", (panel) => {
							const instances = panel.instances.filter((entry) => entry.instanceId !== instanceId);
							const nextActive = panel.activeInstanceId === instanceId
								? instances[instances.length - 1]?.instanceId ?? null
								: panel.activeInstanceId;
							return { instances, activeInstanceId: nextActive };
						})
					}
				/>
			</div>
			<StatusBar />
		</div>
	);
}
