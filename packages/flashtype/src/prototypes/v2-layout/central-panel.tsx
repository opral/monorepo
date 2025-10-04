import { useDroppable } from "@dnd-kit/core";
import { Panel } from "./panel";
import type { PanelState, PanelSide, ViewContext } from "./types";
import { VIEW_MAP } from "./view-registry";
import { ViewPanel } from "./view-panel";

interface CentralPanelProps {
	readonly panel: PanelState;
	readonly onSelectView: (instanceKey: string) => void;
	readonly onRemoveView: (instanceKey: string) => void;
	readonly viewContext?: ViewContext;
	readonly isFocused: boolean;
	readonly onFocusPanel: (side: PanelSide) => void;
	readonly onFinalizePendingView?: (instanceKey: string) => void;
}

/**
 * Central panel - the main content area between left and right panels.
 *
 * @example
 * <CentralPanel panel={centralPanel} onSelectView={...} onRemoveView={...} />
 */
export function CentralPanel({
	panel,
	onSelectView,
	onRemoveView,
	viewContext,
	isFocused,
	onFocusPanel,
	onFinalizePendingView,
}: CentralPanelProps) {
	const { setNodeRef, isOver } = useDroppable({
		id: "central-panel",
		data: { panel: "central" },
	});

	const activeEntry = panel.activeInstanceKey
		? (panel.views.find(
				(view) => view.instanceKey === panel.activeInstanceKey,
			) ?? null)
		: (panel.views[0] ?? null);

	const activeView = activeEntry
		? (VIEW_MAP.get(activeEntry.viewKey) ?? null)
		: null;

	const hasViews = panel.views.length > 0;

	const contextWithFocus: ViewContext | undefined = viewContext
		? { ...viewContext, isPanelFocused: isFocused }
		: { isPanelFocused: isFocused };

	const finalizePendingIfNeeded = () => {
		if (activeEntry?.isPending && onFinalizePendingView) {
			onFinalizePendingView(activeEntry.instanceKey);
		}
	};

	return (
		<section
			ref={setNodeRef}
			onClickCapture={() => onFocusPanel("central")}
			className="flex h-full w-full flex-col text-neutral-900"
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
									label={entry.metadata?.label || view.label}
									isActive={isActive}
									isFocused={isFocused && isActive}
									isPending={entry.isPending}
									onClick={() => onSelectView(entry.instanceKey)}
									onClose={() => onRemoveView(entry.instanceKey)}
									dragData={{
										instanceKey: entry.instanceKey,
										viewKey: entry.viewKey,
										fromPanel: "central",
									}}
								/>
							);
						})}
					</Panel.TabBar>
				)}

				{hasViews ? (
					<Panel.Content
						onPointerDownCapture={finalizePendingIfNeeded}
						onFocusCapture={finalizePendingIfNeeded}
					>
						{activeView && activeEntry && (
							<ViewPanel
								view={activeView}
								context={contextWithFocus}
								viewInstance={activeEntry}
							/>
						)}
					</Panel.Content>
				) : (
					<Panel.Content className="px-6 pt-4 text-sm leading-7">
						<h1 className="mb-5 text-base font-normal text-neutral-900">
							Welcome to Opral's repository.
						</h1>

						<div className="mb-8 space-y-1 text-[15px]">
							<div className="flex items-baseline gap-2">
								<a
									href="https://lix.dev"
									target="_blank"
									rel="noreferrer"
									className="text-blue-600 hover:text-blue-700 hover:underline"
								>
									./lix ↗
								</a>
								<span className="text-neutral-400">-</span>
								<span className="font-semibold text-neutral-900">
									change control
								</span>
								<span className="text-neutral-600">backend for apps</span>
							</div>
							<div className="flex items-baseline gap-2">
								<a
									href="https://inlang.com"
									target="_blank"
									rel="noreferrer"
									className="text-blue-600 hover:text-blue-700 hover:underline"
								>
									./inlang ↗
								</a>
								<span className="text-neutral-400">-</span>
								<span className="font-semibold text-neutral-900">
									globalization ecosystem
								</span>
								<span className="text-neutral-600">for software companies</span>
							</div>
						</div>

						<h2 className="mb-3 text-base font-bold text-neutral-900">
							Quicklinks
						</h2>

						<table className="mb-8 w-full max-w-2xl border-collapse border border-neutral-100 text-[15px] text-neutral-900">
							<thead>
								<tr className="bg-neutral-100">
									<th className="border border-neutral-100 px-4 py-2.5 text-left font-semibold text-neutral-900">
										Link
									</th>
									<th className="border border-neutral-100 px-4 py-2.5 text-left font-semibold text-neutral-900">
										Description
									</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td className="border border-neutral-100 px-4 py-2.5">
										<a
											href="https://opral.com/careers"
											target="_blank"
											rel="noreferrer"
											className="text-blue-600 hover:text-blue-700 hover:underline"
										>
											./careers ↗
										</a>
									</td>
									<td className="border border-neutral-100 px-4 py-2.5 text-neutral-600">
										Open positions @ Opral
									</td>
								</tr>
								<tr>
									<td className="border border-neutral-100 px-4 py-2.5">
										<a
											href="https://github.com/opral/monorepo"
											target="_blank"
											rel="noreferrer"
											className="text-blue-600 hover:text-blue-700 hover:underline"
										>
											./contributing ↗
										</a>
									</td>
									<td className="border border-neutral-100 px-4 py-2.5 text-neutral-600">
										Contribute to inlang or lix
									</td>
								</tr>
								<tr>
									<td className="border border-neutral-100 px-4 py-2.5">
										<a
											href="https://discord.gg/inlang"
											target="_blank"
											rel="noreferrer"
											className="text-blue-600 hover:text-blue-700 hover:underline"
										>
											Official Discord ↗
										</a>
									</td>
									<td className="border border-neutral-100 px-4 py-2.5 text-neutral-600">
										Join our official Discord
									</td>
								</tr>
								<tr>
									<td className="border border-neutral-100 px-4 py-2.5">
										<a
											href="https://github.com/opral/monorepo/discussions"
											target="_blank"
											rel="noreferrer"
											className="text-blue-600 hover:text-blue-700 hover:underline"
										>
											Discussions ↗
										</a>
									</td>
									<td className="border border-neutral-100 px-4 py-2.5 text-neutral-600">
										Discuss new features
									</td>
								</tr>
								<tr>
									<td className="border border-neutral-100 px-4 py-2.5">
										<a
											href="https://inlang.com"
											target="_blank"
											rel="noreferrer"
											className="text-blue-600 hover:text-blue-700 hover:underline"
										>
											inlang.com ↗
										</a>
									</td>
									<td className="border border-neutral-100 px-4 py-2.5 text-neutral-600">
										Search through the ecosystem
									</td>
								</tr>
							</tbody>
						</table>

						<h2 className="mb-3 text-base font-bold text-neutral-900">
							Support
						</h2>
						<p className="mb-4 text-[15px] leading-6">
							If you need support for inlang, one of inlang's products or lix,
							we encourage you to join our{" "}
							<a
								href="https://discord.gg/inlang"
								target="_blank"
								rel="noreferrer"
								className="text-blue-600 hover:text-blue-700 hover:underline"
							>
								Discord ↗
							</a>{" "}
							where we usually respond and help as soon as possible.
						</p>
						<p className="text-[15px] leading-6">
							Do you have a request that has to do with security,
							privacy-related, or other non-related issues? Find our{" "}
							<a
								href="https://opral.com/security"
								target="_blank"
								rel="noreferrer"
								className="text-blue-600 hover:text-blue-700 hover:underline"
							>
								security policy here ↗
							</a>{" "}
							or contact us via e-mail:{" "}
							<code className="rounded bg-neutral-100 px-1.5 py-0.5 text-sm text-neutral-900">
								hello@opral.com
							</code>
							.
						</p>
					</Panel.Content>
				)}
			</Panel>
		</section>
	);
}
