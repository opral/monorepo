import { useState, useId } from "react";
import { ArrowUp, ChevronDown, Plus } from "lucide-react";
import { ChatMessageList } from "@/components/agent-chat/chat-message-list";
import type { ViewContext } from "../../types";
import type { ChatMessage } from "@/components/agent-chat/types";

type AgentViewProps = {
	readonly context?: ViewContext;
};

// Mock data to demonstrate the Claude Code-inspired UI
const MOCK_MESSAGES: ChatMessage[] = [
	{
		id: "1",
		role: "user",
		content:
			"can you see the vscode's extensions source code at ~/.vscode/extensions/anthropic.claude-code-2.0.5/webview?",
	},
	{
		id: "2",
		role: "assistant",
		content: "",
		toolRuns: [
			{
				id: "t1",
				title: "Bash",
				detail: "List contents of Claude Code extension webview directory",
				status: "success",
				input:
					"ls -la ~/.vscode/extensions/anthropic.claude-code-2.0.5/webview",
				output: `total 9008
drwxr-xr-x  5 samuel  staff      160 Oct  3 09:19 .
drwxr-xr-x  9 samuel  staff      288 Oct  3 09:19 ..
-rw-r--r--  1 samuel  staff    80340 Oct  3 09:19 codicon-37A3DWZT.ttf
-rw-r--r--  1 samuel  staff   167564 Oct  3 09:19 index.css
-rw-r--r--  1 samuel  staff  4362164 Oct  3 09:19 index.js`,
			},
			{
				id: "t2",
				title: "Read",
				detail: "index.js (lines 2-101)",
				status: "success",
				input:
					"/Users/samuel/.vscode/extensions/anthropic.claude-code-2.0.5/webview/index.js",
				output: `var TKe=Object.create;var dX=Object.defineProperty;...
[498 lines truncated]`,
			},
			{
				id: "t3",
				title: "Read",
				detail: "index.css (lines 2-201)",
				status: "success",
				input:
					"/Users/samuel/.vscode/extensions/anthropic.claude-code-2.0.5/webview/index.css",
			},
			{
				id: "t3a",
				title: "",
				status: "thinking",
				content:
					"Yes! I can access that directory. Let me explore the structure:",
			},
		],
	},
	{
		id: "3",
		role: "assistant",
		content: "",
		toolRuns: [
			{
				id: "t3b",
				title: "",
				status: "thinking",
				content:
					"The files are too large since they're bundled/minified. Let me check if there's a source directory or look at the extension's package structure:",
			},
			{
				id: "t4",
				title: "Bash",
				detail: "List Claude Code extension root directory",
				status: "success",
				input: "ls -la ~/.vscode/extensions/anthropic.claude-code-2.0.5/",
				output: `total 1936
drwxr-xr-x   9 samuel  staff     288 Oct  3 09:19 .
drwxr-xr-x  89 samuel  staff    2848 Oct  4 17:53 ..
-rw-r--r--   1 samuel  staff    1969 Oct  3 09:19 .vsixmanifest
-rw-r--r--   1 samuel  staff   12368 Oct  3 09:19 claude-code-settings.schema.json
-rw-r--r--   1 samuel  staff  954679 Oct  3 09:19 extension.js
-rw-r--r--   1 samuel  staff    5974 Oct  3 09:19 package.json
-rw-r--r--   1 samuel  staff    1360 Oct  3 09:19 README.md
drwxr-xr-x   8 samuel  staff     256 Oct  3 09:19 resources
drwxr-xr-x   5 samuel  staff     160 Oct  3 09:19 webview`,
			},
			{
				id: "t5",
				title: "Glob",
				detail: 'pattern: "**/panel-views/**/index.tsx"',
				status: "success",
				input: 'find . -path "**/panel-views/**/index.tsx"',
				output: `/Users/samuel/git-repos/monorepo-3/packages/flashtype/src/prototypes/v2-layout/panel-views/agent-view/index.tsx
/Users/samuel/git-repos/monorepo-3/packages/flashtype/src/prototypes/v2-layout/panel-views/diff-view/index.tsx`,
			},
			{
				id: "t5a",
				title: "",
				status: "thinking",
				content:
					"The extension is bundled. However, I can help you design an AI agent chat view inspired by Claude Code's UI.",
			},
		],
	},
];

/**
 * Claude Code-inspired agent chat view (UI-only mock for now).
 * Demonstrates the new tool visualization design with collapsible sections.
 */
export function AgentView({ context }: AgentViewProps) {
	const [messages] = useState<ChatMessage[]>(MOCK_MESSAGES);
	const textAreaId = useId();
	const hasConversations = false;
	const conversationLabel = hasConversations
		? "New conversation"
		: "No previous conversations";

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			{/* Header with conversation picker */}
			<header className="flex items-center justify-between border-b border-border/80 py-1">
				<button
					type="button"
					disabled={!hasConversations}
					className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium text-foreground transition hover:text-foreground/70 disabled:cursor-default disabled:text-muted-foreground"
				>
					<span>{conversationLabel}</span>
					<ChevronDown className="h-4 w-4" />
				</button>
				<button
					type="button"
					className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground/70"
				>
					<Plus className="h-4 w-4" />
				</button>
			</header>

			{/* Chat messages */}
			<div className="flex-1 min-h-0 overflow-y-auto">
				<ChatMessageList messages={messages} />
			</div>

			{/* Input area */}
			<div className="sticky bottom-0 flex justify-center px-2 pb-2 pt-6">
				<form className="w-full max-w-3xl overflow-hidden rounded-md border border-border/80 bg-background">
					<label htmlFor={textAreaId} className="sr-only">
						Ask the assistant
					</label>
					<textarea
						id={textAreaId}
						placeholder="Ask Lix Agent…"
						className="h-28 w-full resize-none border-b border-border/70 bg-transparent px-3 py-3 text-sm leading-6 text-foreground outline-none focus-visible:bg-muted/40"
					/>
					<div className="flex items-center justify-end gap-2 bg-muted/40 px-3 py-1 text-[10px] text-muted-foreground">
						<span className="text-muted-foreground/60">/</span>
						<button
							type="submit"
							className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-muted text-muted-foreground transition hover:bg-muted/80"
						>
							<ArrowUp className="h-3.5 w-3.5" />
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

export default AgentView;
