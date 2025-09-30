import {
	CalendarDays,
	Command,
	GitCommit,
	MessageSquare,
	Search,
	Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ToolDefinition, ToolId } from "./types";

/**
 * Canonical catalogue of prototype tools available to each panel.
 *
 * @example
 * const filesTool = TOOL_DEFINITIONS.find((tool) => tool.id === "files");
 */
export const TOOL_DEFINITIONS: ToolDefinition[] = [
	{
		id: "files",
		label: "Files",
		description: "Browse and pin project documents.",
		icon: Command,
			render: () => (
			<div className="space-y-2 text-[13px] text-[#33384a]">
				<div className="text-xs font-medium uppercase tracking-[0.08em] text-[#7a7f8f]">
					Pinned
				</div>
				<ul className="space-y-1">
					<li className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-[#edeff5]">
						<span>writing-style.md</span>
						<span className="text-xs text-[#8b92a4]">2 min ago</span>
					</li>
					<li className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-[#edeff5]">
						<span>README.md</span>
						<span className="text-xs text-[#8b92a4]">1 hr ago</span>
					</li>
					<li className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-[#edeff5]">
						<span>docs/architecture.mdx</span>
						<span className="text-xs text-[#8b92a4]">Yesterday</span>
					</li>
				</ul>
			</div>
		),
	},
	{
		id: "search",
		label: "Search",
		description: "Quickly locate files, symbols, or commands.",
		icon: Search,
		render: () => (
			<div className="space-y-3 text-[13px] text-[#33384a]">
				<label className="grid gap-1 text-xs font-medium text-[#6f7586]">
					Query
					<input
						placeholder="Search project..."
						className="rounded-md border border-[#d3d7e2] bg-[#fdfdff] px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#c0c5d2]"
					/>
				</label>
				<div className="space-y-1">
					<div className="text-xs uppercase tracking-[0.08em] text-[#7a7f8f]">
						Suggestions
					</div>
					<ul className="space-y-1">
						<li className="rounded-md px-2 py-1 hover:bg-[#edeff5]">
							Show recently edited files
						</li>
						<li className="rounded-md px-2 py-1 hover:bg-[#edeff5]">
							Find TODO annotations
						</li>
						<li className="rounded-md px-2 py-1 hover:bg-[#edeff5]">
							Open flashtype config
						</li>
					</ul>
				</div>
			</div>
		),
	},
	{
		id: "git",
		label: "Git",
		description: "Review progress and staging status.",
		icon: GitCommit,
		render: () => (
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
		),
	},
	{
		id: "assistant",
		label: "Assistant",
		description: "Chat with the embedded helper.",
		icon: MessageSquare,
		render: () => (
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
		),
	},
	{
		id: "terminal",
		label: "Terminal",
		description: "Run quick project commands.",
		icon: Terminal,
		render: () => (
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
		),
	},
	{
		id: "tasks",
		label: "Tasks",
		description: "Track the current sprint notes.",
		icon: CalendarDays,
		render: () => (
			<div className="space-y-2 text-[13px] text-[#33384a]">
				<ul className="space-y-2">
					<li className="rounded-lg border border-[#d9dce3] bg-[#fdfdff] px-3 py-2">
						<div className="flex items-center justify-between text-sm">
							<span>Polish layout prototype</span>
							<span className="text-xs text-[#7a7f8f]">In progress</span>
						</div>
						<p className="text-xs text-[#6f7586]">
							Review padding and responsiveness before demo.
						</p>
					</li>
					<li className="rounded-lg border border-[#d9dce3] bg-[#fdfdff] px-3 py-2">
						<div className="flex items-center justify-between text-sm">
							<span>Sync with design</span>
							<span className="text-xs text-[#7a7f8f]">Todo</span>
						</div>
						<p className="text-xs text-[#6f7586]">
							Align neutral palette with Fleet islands guidance.
						</p>
					</li>
				</ul>
			</div>
		),
	},
];

export const TOOL_MAP = new Map<ToolId, ToolDefinition>(
	TOOL_DEFINITIONS.map((tool) => [tool.id, tool]),
);

let toolCounter = 0;

/**
 * Generates a stable identifier for each opened tool instance.
 *
 * @example
 * const id = createToolInstanceId("files");
 */
export function createToolInstanceId(toolId: ToolId): string {
	toolCounter += 1;
	return `${toolId}-${toolCounter}`;
}
