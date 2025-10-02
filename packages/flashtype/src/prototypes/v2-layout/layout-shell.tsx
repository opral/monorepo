import { useMemo, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
	DndContext,
	DragOverlay,
	type DragEndEvent,
	type DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { SidePanel } from "./side-panel";
import { CentralPanel } from "./central-panel";
import { TopBar } from "./top-bar";
import { StatusBar } from "./status-bar";
import type { PanelSide, PanelState, ViewId } from "./types";
import { createViewInstanceId, VIEW_MAP } from "./view-registry";
import { Panel as PanelComponent } from "./panel";

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
	const [centralPanel, setCentralPanel] = useState<PanelState>(() => ({
		instances: [],
		activeInstanceId: null,
	}));
	const [rightPanel, setRightPanel] = useState<PanelState>(() => ({
		instances: [],
		activeInstanceId: null,
	}));
	const [focusedPanel, setFocusedPanel] = useState<PanelSide>("left");

	const panels = useMemo(
		() => ({ left: leftPanel, central: centralPanel, right: rightPanel }),
		[leftPanel, centralPanel, rightPanel],
	);

	const hydrate = (panel: PanelState): PanelState => ({
		instances: panel.instances,
		activeInstanceId:
			panel.instances.length === 0
				? null
				: (panel.activeInstanceId ?? panel.instances[0]?.instanceId ?? null),
	});

	const setPanelState = (
		side: PanelSide,
		reducer: (state: PanelState) => PanelState,
		options: { focus?: boolean } = {},
	) => {
		if (side === "left") {
			setLeftPanel((prev) => reducer(hydrate(prev)));
		} else if (side === "central") {
			setCentralPanel((prev) => reducer(hydrate(prev)));
		} else {
			setRightPanel((prev) => reducer(hydrate(prev)));
		}
		if (options.focus) {
			setFocusedPanel(side);
		}
	};

	const focusPanel = (side: PanelSide) => setFocusedPanel(side);

	const hydratedLeft = hydrate(panels.left);
	const hydratedCentral = hydrate(panels.central);
	const hydratedRight = hydrate(panels.right);

	const [activeId, setActiveId] = useState<string | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
	);

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(event.active.id as string);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		setActiveId(null);
		const { active, over } = event;

		if (!over || active.id === over.id) return;

		// Parse drag data
		const dragData = active.data.current as
			| { instanceId: string; viewId: ViewId; fromPanel: PanelSide }
			| undefined;
		const dropData = over.data.current as { panel: PanelSide } | undefined;

		if (!dragData || !dropData) return;

		const { instanceId, viewId, fromPanel } = dragData;
		const { panel: toPanel } = dropData;

		// Remove from source panel
		setPanelState(fromPanel, (panel) => ({
			instances: panel.instances.filter((i) => i.instanceId !== instanceId),
			activeInstanceId:
				panel.activeInstanceId === instanceId ? null : panel.activeInstanceId,
		}));

		// Add to target panel
		setPanelState(
			toPanel,
			(panel) => {
				const newInstance = { instanceId, viewId };
				return {
					instances: [...panel.instances, newInstance],
					activeInstanceId: newInstance.instanceId,
				};
			},
			{ focus: true },
		);
	};

	const activeDragData = activeId
		? [
				...hydratedLeft.instances,
				...hydratedCentral.instances,
				...hydratedRight.instances,
			].find((i) => i.instanceId === activeId)
		: null;
	const activeDragView = activeDragData
		? VIEW_MAP.get(activeDragData.viewId)
		: null;

	const handleOpenFile = (filePath: string) => {
		const existingFileInstance = hydratedCentral.instances.find(
			(instance) => instance.metadata?.filePath === filePath,
		);

		if (existingFileInstance) {
			// Focus existing tab
			setPanelState(
				"central",
				(panel) => ({
					instances: panel.instances,
					activeInstanceId: existingFileInstance.instanceId,
				}),
				{ focus: true },
			);
		} else {
			const label = filePath.split("/").filter(Boolean).pop() ?? filePath;
			const newInstance = {
				instanceId: `file-${filePath}-${Date.now()}`,
				viewId: "file-content" as ViewId,
				metadata: {
					filePath,
					label,
				},
			};
			setPanelState(
				"central",
				(panel) => ({
					instances: [...panel.instances, newInstance],
					activeInstanceId: newInstance.instanceId,
				}),
				{ focus: true },
			);
		}
	};

	return (
		<DndContext
			sensors={sensors}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
		>
			<div className="flex h-screen flex-col bg-neutral-100 text-neutral-900">
				<TopBar />
				<div className="flex flex-1 overflow-hidden px-2 gap-4">
					<PanelGroup direction="horizontal">
						<Panel defaultSize={20} minSize={10} maxSize={40}>
							<SidePanel
								side="left"
								title="Navigator"
								panel={hydratedLeft}
								isFocused={focusedPanel === "left"}
								onFocusPanel={focusPanel}
								onSelectView={(instanceId) =>
									setPanelState(
										"left",
										(panel) => ({
											instances: panel.instances,
											activeInstanceId: instanceId,
										}),
										{ focus: true },
									)
								}
								onAddView={(viewId) =>
									setPanelState(
										"left",
										(panel) => {
											const next = {
												instanceId: createViewInstanceId(viewId),
												viewId,
											};
											return {
												instances: [...panel.instances, next],
												activeInstanceId: next.instanceId,
											};
										},
										{ focus: true },
									)
								}
								onRemoveView={(instanceId) =>
									setPanelState(
										"left",
										(panel) => {
											const instances = panel.instances.filter(
												(entry) => entry.instanceId !== instanceId,
											);
											const nextActive =
												panel.activeInstanceId === instanceId
													? (instances[instances.length - 1]?.instanceId ??
														null)
													: panel.activeInstanceId;
											return { instances, activeInstanceId: nextActive };
										},
										{ focus: true },
									)
								}
								viewContext={{ onOpenFile: handleOpenFile }}
							/>
						</Panel>
						<PanelResizeHandle className="relative w-1 flex items-center justify-center group">
							<div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 h-full rounded-full bg-gradient-to-b from-transparent via-brand-600/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
						</PanelResizeHandle>
						<Panel defaultSize={60} minSize={30}>
							<CentralPanel
								panel={hydratedCentral}
								isFocused={focusedPanel === "central"}
								onFocusPanel={focusPanel}
								onSelectView={(instanceId) =>
									setPanelState(
										"central",
										(panel) => ({
											instances: panel.instances,
											activeInstanceId: instanceId,
										}),
										{ focus: true },
									)
								}
								onRemoveView={(instanceId) =>
									setPanelState(
										"central",
										(panel) => {
											const instances = panel.instances.filter(
												(entry) => entry.instanceId !== instanceId,
											);
											const nextActive =
												panel.activeInstanceId === instanceId
													? (instances[instances.length - 1]?.instanceId ??
														null)
													: panel.activeInstanceId;
											return { instances, activeInstanceId: nextActive };
										},
										{ focus: true },
									)
								}
								viewContext={{ onOpenFile: handleOpenFile }}
							/>
						</Panel>
						<PanelResizeHandle className="relative w-1 flex items-center justify-center group">
							<div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 h-full rounded-full bg-gradient-to-b from-transparent via-brand-600/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
						</PanelResizeHandle>
						<Panel defaultSize={20} minSize={10} maxSize={40}>
							<SidePanel
								side="right"
								title="Secondary"
								panel={hydratedRight}
								isFocused={focusedPanel === "right"}
								onFocusPanel={focusPanel}
								onSelectView={(instanceId) =>
									setPanelState(
										"right",
										(panel) => ({
											instances: panel.instances,
											activeInstanceId: instanceId,
										}),
										{ focus: true },
									)
								}
								onAddView={(viewId) =>
									setPanelState(
										"right",
										(panel) => {
											const next = {
												instanceId: createViewInstanceId(viewId),
												viewId,
											};
											return {
												instances: [...panel.instances, next],
												activeInstanceId: next.instanceId,
											};
										},
										{ focus: true },
									)
								}
								onRemoveView={(instanceId) =>
									setPanelState(
										"right",
										(panel) => {
											const instances = panel.instances.filter(
												(entry) => entry.instanceId !== instanceId,
											);
											const nextActive =
												panel.activeInstanceId === instanceId
													? (instances[instances.length - 1]?.instanceId ??
														null)
													: panel.activeInstanceId;
											return { instances, activeInstanceId: nextActive };
										},
										{ focus: true },
									)
								}
								viewContext={{ onOpenFile: handleOpenFile }}
							/>
						</Panel>
					</PanelGroup>
				</div>
				<StatusBar />
			</div>
			<DragOverlay>
				{activeId && activeDragView ? (
					<div className="cursor-grabbing">
						<PanelComponent.Tab
							icon={activeDragView.icon}
							label={activeDragView.label}
							isActive={true}
							isFocused={true}
						/>
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	);
}
