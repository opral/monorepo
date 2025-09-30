import { Button } from "@/components/ui/button";

/**
 * Assistant tool - Chat with the embedded helper
 */
export function AssistantTool() {
	return (
		<div className="flex h-full flex-col gap-2 text-[13px] text-[#33384a]">
			<div className="space-y-1 rounded-lg border border-[#d9dce3] bg-[#fdfdff] p-3">
				<div className="text-xs font-medium uppercase tracking-[0.08em] text-[#7a7f8f]">
					Assistant
				</div>
				<p>
					Highlight the tone changes in writing-style.md compared to main.
				</p>
			</div>
			<div className="space-y-1 rounded-lg border border-[#d9dce3] bg-[#f4f5fa] p-3">
				<div className="text-xs font-medium uppercase tracking-[0.08em] text-[#7a7f8f]">
					You
				</div>
				<p>
					Draft a succinct summary paragraph for the upcoming release notes.
				</p>
			</div>
			<label className="mt-auto grid gap-1 text-xs font-medium text-[#6f7586]">
				Reply
				<textarea
					rows={3}
					placeholder="Ask the assistant..."
					className="w-full resize-none rounded-md border border-[#d3d7e2] bg-[#fdfdff] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#c0c5d2]"
				/>
			</label>
			<Button
				variant="ghost"
				size="sm"
				className="self-end rounded-md border border-[#d9dce3] bg-[#f8f9fb] text-xs text-[#33384a] hover:bg-[#edeff5]"
			>
				Send
			</Button>
		</div>
	);
}
