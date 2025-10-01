import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Panel } from "./panel";

/**
 * Central panel - the main content area between left and right panels.
 *
 * @example
 * <CentralPanel />
 */
export function CentralPanel() {
	return (
		<section className="flex min-h-0 flex-1 flex-col text-onsurface-primary">
			<Panel>
				<Panel.TabBar>
					<Panel.Tab
						icon={FileText}
						label="writing-style.md"
						isActive={true}
						isFocused={true}
						onClose={() => {}}
					/>
					<Panel.Tab
						icon={FileText}
						label="AGENTS.md"
						isActive={false}
						isFocused={true}
						onClose={() => {}}
					/>
				</Panel.TabBar>

				<Panel.Content className="px-6 pt-4 text-sm leading-7">
					<h1 className="mb-5 text-base font-normal text-onsurface-primary">
						Welcome to Opral's repository.
					</h1>

					<div className="mb-8 space-y-1 text-[15px]">
						<div className="flex items-baseline gap-2">
							<a href="#" className="text-link-primary hover:text-link-primary-hover hover:underline">
								./lix ↗
							</a>
							<span className="text-onsurface-tertiary">-</span>
							<span className="font-semibold text-onsurface-primary">
								change control
							</span>
							<span className="text-onsurface-secondary">backend for apps</span>
						</div>
						<div className="flex items-baseline gap-2">
							<a href="#" className="text-link-primary hover:text-link-primary-hover hover:underline">
								./inlang ↗
							</a>
							<span className="text-onsurface-tertiary">-</span>
							<span className="font-semibold text-onsurface-primary">
								globalization ecosystem
							</span>
							<span className="text-onsurface-secondary">for software companies</span>
						</div>
					</div>

					<h2 className="mb-3 text-base font-bold text-onsurface-primary">
						Quicklinks
					</h2>

					<table className="mb-8 w-full max-w-2xl border-collapse border border-stroke-100 text-[15px] text-onsurface-primary">
						<thead>
							<tr className="bg-surface-300">
								<th className="border border-stroke-100 px-4 py-2.5 text-left font-semibold text-onsurface-primary">
									Link
								</th>
								<th className="border border-stroke-100 px-4 py-2.5 text-left font-semibold text-onsurface-primary">
									Description
								</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td className="border border-stroke-100 px-4 py-2.5">
									<a href="#" className="text-link-primary hover:text-link-primary-hover hover:underline">
										./careers ↗
									</a>
								</td>
								<td className="border border-stroke-100 px-4 py-2.5 text-onsurface-secondary">
									Open positions @ Opral
								</td>
							</tr>
							<tr>
								<td className="border border-stroke-100 px-4 py-2.5">
									<a href="#" className="text-link-primary hover:text-link-primary-hover hover:underline">
										./contributing ↗
									</a>
								</td>
								<td className="border border-stroke-100 px-4 py-2.5 text-onsurface-secondary">
									Contribute to inlang or lix
								</td>
							</tr>
							<tr>
								<td className="border border-stroke-100 px-4 py-2.5">
									<a href="#" className="text-link-primary hover:text-link-primary-hover hover:underline">
										Official Discord ↗
									</a>
								</td>
								<td className="border border-stroke-100 px-4 py-2.5 text-onsurface-secondary">
									Join our official Discord
								</td>
							</tr>
							<tr>
								<td className="border border-stroke-100 px-4 py-2.5">
									<a href="#" className="text-link-primary hover:text-link-primary-hover hover:underline">
										Discussions ↗
									</a>
								</td>
								<td className="border border-stroke-100 px-4 py-2.5 text-onsurface-secondary">
									Discuss new features
								</td>
							</tr>
							<tr>
								<td className="border border-stroke-100 px-4 py-2.5">
									<a href="#" className="text-link-primary hover:text-link-primary-hover hover:underline">
										inlang.com ↗
									</a>
								</td>
								<td className="border border-stroke-100 px-4 py-2.5 text-onsurface-secondary">
									Search through the ecosystem
								</td>
							</tr>
						</tbody>
					</table>

					<h2 className="mb-3 text-base font-bold text-onsurface-primary">Support</h2>
					<p className="mb-4 text-[15px] leading-6">
						If you need support for inlang, one of inlang's products or lix, we
						encourage you to join our{" "}
						<a href="#" className="text-link-primary hover:text-link-primary-hover hover:underline">
							Discord ↗
						</a>{" "}
						where we usually respond and help as soon as possible.
					</p>
					<p className="text-[15px] leading-6">
						Do you have a request that has to do with security, privacy-related,
						or other non-related issues? Find our{" "}
						<a href="#" className="text-link-primary hover:text-link-primary-hover hover:underline">
							security policy here ↗
						</a>{" "}
						or contact us via e-mail:{" "}
						<code className="rounded bg-surface-300 px-1.5 py-0.5 text-sm text-onsurface-primary">
							hello@opral.com
						</code>
						.
					</p>
				</Panel.Content>
			</Panel>
		</section>
	);
}
