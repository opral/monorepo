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
		<section className="flex min-h-0 flex-1 flex-col text-[#3f4454]">
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
					<h1 className="mb-5 text-base font-normal text-[#212430]">
						Welcome to Opral's repository.
					</h1>

					<div className="mb-8 space-y-1 text-[15px]">
						<div className="flex items-baseline gap-2">
							<a href="#" className="text-[#3b82f6] hover:underline">
								./lix ↗
							</a>
							<span className="text-[#6f7586]">-</span>
							<span className="font-semibold text-[#212430]">
								change control
							</span>
							<span className="text-[#6f7586]">backend for apps</span>
						</div>
						<div className="flex items-baseline gap-2">
							<a href="#" className="text-[#3b82f6] hover:underline">
								./inlang ↗
							</a>
							<span className="text-[#6f7586]">-</span>
							<span className="font-semibold text-[#212430]">
								globalization ecosystem
							</span>
							<span className="text-[#6f7586]">for software companies</span>
						</div>
					</div>

					<h2 className="mb-3 text-base font-bold text-[#212430]">
						Quicklinks
					</h2>

					<table className="mb-8 w-full max-w-2xl border-collapse border border-[#e0e0e0] text-[15px]">
						<thead>
							<tr className="bg-[#f5f5f5]">
								<th className="border border-[#e0e0e0] px-4 py-2.5 text-left font-semibold text-[#212430]">
									Link
								</th>
								<th className="border border-[#e0e0e0] px-4 py-2.5 text-left font-semibold text-[#212430]">
									Description
								</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td className="border border-[#e0e0e0] px-4 py-2.5">
									<a href="#" className="text-[#3b82f6] hover:underline">
										./careers ↗
									</a>
								</td>
								<td className="border border-[#e0e0e0] px-4 py-2.5 text-[#6f7586]">
									Open positions @ Opral
								</td>
							</tr>
							<tr>
								<td className="border border-[#e0e0e0] px-4 py-2.5">
									<a href="#" className="text-[#3b82f6] hover:underline">
										./contributing ↗
									</a>
								</td>
								<td className="border border-[#e0e0e0] px-4 py-2.5 text-[#6f7586]">
									Contribute to inlang or lix
								</td>
							</tr>
							<tr>
								<td className="border border-[#e0e0e0] px-4 py-2.5">
									<a href="#" className="text-[#3b82f6] hover:underline">
										Official Discord ↗
									</a>
								</td>
								<td className="border border-[#e0e0e0] px-4 py-2.5 text-[#6f7586]">
									Join our official Discord
								</td>
							</tr>
							<tr>
								<td className="border border-[#e0e0e0] px-4 py-2.5">
									<a href="#" className="text-[#3b82f6] hover:underline">
										Discussions ↗
									</a>
								</td>
								<td className="border border-[#e0e0e0] px-4 py-2.5 text-[#6f7586]">
									Discuss new features
								</td>
							</tr>
							<tr>
								<td className="border border-[#e0e0e0] px-4 py-2.5">
									<a href="#" className="text-[#3b82f6] hover:underline">
										inlang.com ↗
									</a>
								</td>
								<td className="border border-[#e0e0e0] px-4 py-2.5 text-[#6f7586]">
									Search through the ecosystem
								</td>
							</tr>
						</tbody>
					</table>

					<h2 className="mb-3 text-base font-bold text-[#212430]">Support</h2>
					<p className="mb-4 text-[15px] leading-6 text-[#6f7586]">
						If you need support for inlang, one of inlang's products or lix, we
						encourage you to join our{" "}
						<a href="#" className="text-[#3b82f6] hover:underline">
							Discord ↗
						</a>{" "}
						where we usually respond and help as soon as possible.
					</p>
					<p className="text-[15px] leading-6 text-[#6f7586]">
						Do you have a request that has to do with security, privacy-related,
						or other non-related issues? Find our{" "}
						<a href="#" className="text-[#3b82f6] hover:underline">
							security policy here ↗
						</a>{" "}
						or contact us via e-mail:{" "}
						<code className="rounded bg-[#f5f5f5] px-1.5 py-0.5 text-sm">
							hello@opral.com
						</code>
						.
					</p>
				</Panel.Content>
			</Panel>
		</section>
	);
}
