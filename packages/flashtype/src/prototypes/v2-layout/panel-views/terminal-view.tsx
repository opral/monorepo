import { Button } from "@/components/ui/button";

/**
 * Terminal view - Run quick project commands
 */
export function TerminalView() {
	return (
		<div className="space-y-2 text-[13px] text-[#33384a]">
			<div className="rounded-[10px] border border-[#171b23] bg-[#171b23] p-3 font-mono text-xs text-[#f4f7ff]">
				<span className="text-[#8be9fd]">›</span> pnpm test flashtype
			</div>
			<div className="rounded-[10px] border border-[#171b23] bg-[#171b23] p-3 font-mono text-xs text-[#f4f7ff]">
				PASS editor/formatting-toolbar.test.tsx (3.1 s)
			</div>
			<Button
				size="sm"
				variant="outline"
				className="w-full rounded-md border-[#d9dce3] text-xs text-[#33384a] hover:bg-[#edeff5]"
			>
				Run another command
			</Button>
		</div>
	);
}
