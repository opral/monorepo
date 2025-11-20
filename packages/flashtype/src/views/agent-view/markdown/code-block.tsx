import * as React from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { solarizedlight } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
	Collapsible,
	CollapsibleContent,
} from "@/components/ui/collapsible";

export function CodeBlock({
	code,
	language,
}: {
	code: string;
	language: string;
}) {
	const lineCount = React.useMemo(() => code.split("\n").length, [code]);
	const isLong = lineCount > 15;
	const [isExpanded, setIsExpanded] = React.useState(!isLong);

	const previewLines = React.useMemo(() => {
		if (!isLong || isExpanded) return code;
		return code.split("\n").slice(0, 5).join("\n");
	}, [code, isLong, isExpanded]);

	return (
		<div className="overflow-hidden rounded-md border border-border/50 bg-muted/30">
			<div className="flex items-center justify-between border-b border-border/40 bg-muted/50 px-3 py-1.5">
				<span className="text-xs font-mono font-semibold uppercase tracking-[0.18em] text-muted-foreground">
					{language || "code"}
				</span>
				{isLong && (
					<button
						onClick={() => setIsExpanded(!isExpanded)}
						className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
					>
						{isExpanded ? (
							<>
								Show Less <ChevronUp className="h-3 w-3" />
							</>
						) : (
							<>
								Show More ({lineCount} lines) <ChevronDown className="h-3 w-3" />
							</>
						)}
					</button>
				)}
			</div>
			{isExpanded ? (
				<Collapsible open={isExpanded}>
					<CollapsibleContent>
						<SyntaxHighlighter
							language={language || "text"}
							style={solarizedlight}
							PreTag="div"
							customStyle={{
								margin: 0,
								padding: "0.625rem 0.75rem",
								fontSize: "0.875rem",
								lineHeight: "1.5",
								background: "transparent",
							}}
							codeTagProps={{
								className: "font-mono text-sm",
							}}
						>
							{code}
						</SyntaxHighlighter>
					</CollapsibleContent>
				</Collapsible>
			) : (
				<div className="relative">
					<SyntaxHighlighter
						language={language || "text"}
						style={solarizedlight}
						PreTag="div"
						customStyle={{
							margin: 0,
							padding: "0.625rem 0.75rem",
							fontSize: "0.875rem",
							lineHeight: "1.5",
							background: "transparent",
						}}
						codeTagProps={{
							className: "font-mono text-sm",
						}}
					>
						{previewLines}
					</SyntaxHighlighter>
					<div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-muted/80 to-transparent pointer-events-none" />
				</div>
			)}
		</div>
	);
}
