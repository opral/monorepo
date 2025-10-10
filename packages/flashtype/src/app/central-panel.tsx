import { useCallback } from "react";
import type {
	PanelState,
	PanelSide,
	ViewContext,
	ViewDefinition,
} from "./types";
import { PanelV2 } from "./panel-v2";

type CentralPanelProps = {
	readonly panel: PanelState;
	readonly onSelectView: (instanceKey: string) => void;
	readonly onRemoveView: (instanceKey: string) => void;
	readonly viewContext?: ViewContext;
	readonly isFocused: boolean;
	readonly onFocusPanel: (side: PanelSide) => void;
	readonly onFinalizePendingView?: (instanceKey: string) => void;
};

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
	const finalizePendingIfNeeded = useCallback(
		(instanceKey: string) => {
			if (!onFinalizePendingView) return;
			const entry = panel.views.find(
				(view) => view.instanceKey === instanceKey,
			);
			if (entry?.isPending) {
				onFinalizePendingView(instanceKey);
			}
		},
		[onFinalizePendingView, panel.views],
	);

	const emptyState = (
		<div className="px-6 pt-4 text-base leading-7">
			<h1 className="mb-5 text-base font-normal text-neutral-900">
				Welcome to Opral&apos;s repository.
			</h1>

			<div className="mb-8 space-y-1 text-sm">
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
					<span className="font-semibold text-neutral-900">change control</span>
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

			<h2 className="mb-3 text-base font-bold text-neutral-900">Quicklinks</h2>

			<table className="mb-8 w-full max-w-2xl border-collapse border border-neutral-100 text-sm text-neutral-900">
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
								./discord ↗
							</a>
						</td>
						<td className="border border-neutral-100 px-4 py-2.5 text-neutral-600">
							Join the inlang community
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
				Repositories
			</h2>

			<ul className="space-y-1 text-sm">
				<li>
					<a
						href="https://github.com/opral/monorepo"
						target="_blank"
						rel="noreferrer"
						className="text-blue-600 hover:text-blue-700 hover:underline"
					>
						opral/monorepo ↗
					</a>
					<span className="text-neutral-600">
						{" "}
						- Source for Inlang + Lix apps & SDKs
					</span>
				</li>
				<li>
					<a
						href="https://github.com/opral/inlang"
						target="_blank"
						rel="noreferrer"
						className="text-blue-600 hover:text-blue-700 hover:underline"
					>
						opral/inlang ↗
					</a>
					<span className="text-neutral-600">
						{" "}
						- Companion services & shared assets
					</span>
				</li>
				<li>
					<a
						href="https://github.com/opral/lix-sdk"
						target="_blank"
						rel="noreferrer"
						className="text-blue-600 hover:text-blue-700 hover:underline"
					>
						opral/lix-sdk ↗
					</a>
					<span className="text-neutral-600">
						{" "}
						- Server/client SDKs for the Lix platform
					</span>
				</li>
			</ul>

			<h2 className="mb-3 text-base font-bold text-neutral-900">Support</h2>
			<p className="mb-4 text-base leading-6">
				If you need support for inlang, one of inlang&apos;s products or lix, we
				encourage you to join our{" "}
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
			<p className="text-base leading-6">
				Do you have a request that has to do with security, privacy-related, or
				other non-related issues? Find our{" "}
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
		</div>
	);

	const labelResolver = useCallback(
		(view: ViewDefinition, entry: (typeof panel.views)[number]) =>
			entry.metadata?.label ?? view.label,
		[],
	);

	return (
		<PanelV2
			side="central"
			panel={panel}
			isFocused={isFocused}
			onFocusPanel={onFocusPanel}
			onSelectView={onSelectView}
			onRemoveView={onRemoveView}
			viewContext={viewContext}
			tabLabel={labelResolver}
			onActiveViewInteraction={finalizePendingIfNeeded}
			emptyStatePlaceholder={emptyState}
			emptyStateContentClassName="px-6 pt-4 text-sm leading-7"
			dropId="central-panel"
		/>
	);
}
