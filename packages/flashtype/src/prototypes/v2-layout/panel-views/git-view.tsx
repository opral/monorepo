import { Button } from "@/components/ui/button";

/**
 * Git view - Review progress and staging status
 */
export function GitView() {
	return (
		<div className="space-y-3 text-[13px] text-[#33384a]">
			<div>
				<div className="font-medium text-[#212430]">Working tree clean</div>
				<div className="text-xs text-[#7a7f8f]">main · origin/main</div>
			</div>
			<ul className="space-y-2">
				<li className="rounded-lg border border-[#d9dce3] bg-[#fdfdff] px-3 py-2">
					<div className="flex items-center justify-between text-sm">
						<span>Fleet layout polish</span>
						<span className="text-xs text-[#7a7f8f]">draft</span>
					</div>
					<p className="mt-1 text-xs text-[#6f7586]">
						Capture the islands UI prototype for review.
					</p>
				</li>
			</ul>
			<Button
				variant="ghost"
				size="sm"
				className="w-full rounded-md border border-[#d9dce3] bg-[#f8f9fb] text-xs text-[#33384a] hover:bg-[#edeff5]"
			>
				Commit staged changes
			</Button>
		</div>
	);
}
