import { Bot } from "lucide-react";

const SUGGESTIONS = [
	"Write a blog post",
	"Review your resume",
	"Answer questions about your docs",
];

export function AgentEmptyState() {
	return (
		<div className="flex h-full w-full flex-col items-center justify-center gap-6 p-4">
			<div className="flex flex-col items-center gap-3">
				<div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
					<Bot className="h-6 w-6 text-muted-foreground" />
				</div>
				<h2 className="text-lg font-medium text-foreground">
					What can I do for you?
				</h2>
			</div>
			<ul className="flex flex-col gap-1 text-sm text-muted-foreground">
				{SUGGESTIONS.map((suggestion) => (
					<li key={suggestion}>• {suggestion}</li>
				))}
			</ul>
		</div>
	);
}
