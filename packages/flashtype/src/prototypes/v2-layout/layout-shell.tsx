import { useMemo, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { SidePanel } from "./side-panel";
import { CentralPanel } from "./central-panel";
import { TopBar } from "./top-bar";
import { StatusBar } from "./status-bar";
import type { PanelSide, PanelState, ViewId } from "./types";
import { createViewInstanceId } from "./view-registry";

/**
 * Fleet-style layout shell with independent left and right islands.
 *
 * @example
 * <V2LayoutShell />
 */
export function V2LayoutShell() {
	const [leftPanel, setLeftPanel] = useState<PanelState>(() => ({
		instances: [
			{ instanceId: createViewInstanceId("files"), viewId: "files" },
			{ instanceId: createViewInstanceId("search"), viewId: "search" },
		],
		activeInstanceId: null,
	}));
	const [rightPanel, setRightPanel] = useState<PanelState>(() => ({
		instances: [],
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
		<div className="flex h-screen flex-col bg-surface-300 text-onsurface-primary">
			<TopBar />
			<div className="flex flex-1 overflow-hidden px-2 gap-4">
				<PanelGroup direction="horizontal">
					<Panel defaultSize={20} minSize={10} maxSize={40}>
						<SidePanel
						side="left"
						title="Navigator"
						panel={hydratedLeft}
						onSelectView={(instanceId) =>
							setPanelState("left", (panel) => ({
								instances: panel.instances,
								activeInstanceId: instanceId,
							}))
						}
						onAddView={(viewId) =>
							setPanelState("left", (panel) => {
								const next = {
									instanceId: createViewInstanceId(viewId),
									viewId,
								};
								return {
									instances: [...panel.instances, next],
									activeInstanceId: next.instanceId,
								};
							})
						}
						onRemoveView={(instanceId) =>
							setPanelState("left", (panel) => {
								const instances = panel.instances.filter((entry) => entry.instanceId !== instanceId);
								const nextActive = panel.activeInstanceId === instanceId
									? instances[instances.length - 1]?.instanceId ?? null
									: panel.activeInstanceId;
								return { instances, activeInstanceId: nextActive };
							})
						}
						/>
					</Panel>
					<PanelResizeHandle className="relative w-1 flex items-center justify-center group">
						<div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 h-full rounded-full bg-gradient-to-b from-transparent via-brand-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
					</PanelResizeHandle>
					<Panel defaultSize={60} minSize={30}>
						<CentralPanel />
					</Panel>
					<PanelResizeHandle className="relative w-1 flex items-center justify-center group">
						<div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 h-full rounded-full bg-gradient-to-b from-transparent via-brand-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
					</PanelResizeHandle>
					<Panel defaultSize={20} minSize={10} maxSize={40}>
						<SidePanel
						side="right"
						title="Secondary"
						panel={hydratedRight}
						onSelectView={(instanceId) =>
							setPanelState("right", (panel) => ({
								instances: panel.instances,
								activeInstanceId: instanceId,
							}))
						}
						onAddView={(viewId) =>
							setPanelState("right", (panel) => {
								const next = {
									instanceId: createViewInstanceId(viewId),
									viewId,
								};
								return {
									instances: [...panel.instances, next],
									activeInstanceId: next.instanceId,
								};
							})
						}
						onRemoveView={(instanceId) =>
							setPanelState("right", (panel) => {
								const instances = panel.instances.filter((entry) => entry.instanceId !== instanceId);
								const nextActive = panel.activeInstanceId === instanceId
									? instances[instances.length - 1]?.instanceId ?? null
									: panel.activeInstanceId;
								return { instances, activeInstanceId: nextActive };
							})
						}
					/>
					</Panel>
				</PanelGroup>
			</div>
			<StatusBar />
		</div>
	);
}
