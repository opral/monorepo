import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

/**
 * Central editor island placeholder for the prototype.
 *
 * @example
 * <Workspace />
 */
export function Workspace() {
	return (
		<section className="flex min-h-0 flex-1 flex-col text-[#3f4454]">
			<div className="flex min-h-0 flex-1 flex-col rounded-lg bg-white">
				<div className="flex items-center justify-between px-6 pt-6">
					<div className="flex items-center gap-3">
						<div className="flex h-11 w-11 items-center justify-center bg-[#f0f0f0] text-[#33384a]">
							<FileText className="h-5 w-5" />
						</div>
						<div className="leading-tight">
							<div className="text-sm font-medium text-[#212430]">writing-style.md</div>
							<div className="text-xs text-[#6f7586]">flashtype-mock / docs</div>
						</div>
					</div>
					<div className="flex items-center gap-2 text-xs">
						<Button variant="ghost" size="sm" className="h-8 px-3 text-[#4d5361] hover:bg-[#f0f0f0] hover:text-[#212430]">
							Git History
						</Button>
						<Button variant="ghost" size="sm" className="h-8 px-3 text-[#4d5361] hover:bg-[#f0f0f0] hover:text-[#212430]">
							Share
						</Button>
					<Button
						variant="ghost"
						size="sm"
						className="h-8 bg-[#f0f0f0] px-4 text-[#212430] hover:bg-[#e8e8e8]"
					>
						Save Draft
					</Button>
					</div>
				</div>
				<div className="mt-4 flex items-center gap-2 border-b border-[#e0e0e0] px-6 pb-3 text-xs text-[#6f7586]">
					<button className="flex items-center gap-2 bg-[#f0f0f0] px-3 py-1.5 text-sm font-medium text-[#2d3140]">
						<FileText className="h-4 w-4" />
						<span>writing-style.md</span>
					</button>
					<span className="text-[#c5c9d8]">•</span>
					<span>Markdown</span>
					<span className="text-[#c5c9d8]">•</span>
					<span>Line 42, Col 7</span>
					<div className="ml-auto flex items-center gap-2">
						<Button variant="ghost" size="sm" className="h-7 px-3 text-[11px] text-[#4d5361] hover:bg-[#f0f0f0] hover:text-[#212430]">
							Preview
						</Button>
						<Button variant="ghost" size="sm" className="h-7 px-3 text-[11px] text-[#4d5361] hover:bg-[#f0f0f0] hover:text-[#212430]">
							Diff
						</Button>
					</div>
				</div>
				<div className="flex-1 overflow-auto px-6 pb-8 pt-6 text-sm leading-6">
					<p className="mb-4">
						Welcome to the Fleet-inspired layout prototype. The design keeps its focus on
						the document while surfacing supporting tools as light-weight islands.
					</p>
					<p className="mb-4">
						Both side panels operate independently: open the same tool in each island or
						mix and match depending on the task at hand.
					</p>
					<ul className="list-disc space-y-2 pl-5">
						<li>Muted palette with generous spacing to minimize distractions.</li>
						<li>Quick tool switcher with an “Add” affordance on every island.</li>
						<li>Sticky status footer mirroring Fleet’s lower chrome.</li>
					</ul>
				</div>
			</div>
		</section>
	);
}
