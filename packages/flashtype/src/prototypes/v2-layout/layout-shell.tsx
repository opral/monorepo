import { useMemo, useState } from "react";
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
		<div className="flex min-h-screen flex-col bg-surface-300 text-onsurface-primary">
			<TopBar />
			<div className="flex min-h-0 flex-1 gap-2 px-2">
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
				<CentralPanel />
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
			</div>
			<StatusBar />
		</div>
	);
}
