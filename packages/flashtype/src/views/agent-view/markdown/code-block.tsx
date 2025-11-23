import * as React from "react";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { solarizedlight } from "react-syntax-highlighter/dist/esm/styles/prism";

export function CodeBlock({
	code,
	language,
}: {
	code: string;
	language: string;
}) {
	const lineCount = React.useMemo(() => code.split("\n").length, [code]);
	const isLong = lineCount > 5;
	const [isExpanded, setIsExpanded] = React.useState(!isLong);
	const [copied, setCopied] = React.useState(false);

	const handleCopy = React.useCallback(async () => {
		await navigator.clipboard.writeText(code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [code]);

	const previewLines = React.useMemo(() => {
		if (!isLong || isExpanded) return code;
		return code.split("\n").slice(0, 5).join("\n");
	}, [code, isLong, isExpanded]);

	return (
		<div
			className="overflow-hidden rounded-md border border-border/50 bg-muted/30"
			role="region"
			aria-label={`Code block in ${language || "plain text"}`}
		>
			<div className="flex items-center justify-between border-b border-border/40 bg-muted/50 px-3 py-1.5">
				<span className="text-[0.625rem] font-mono font-normal text-muted-foreground/60">
					{language || "code"}
				</span>
				<button
					onClick={handleCopy}
					className="text-muted-foreground hover:text-foreground transition-colors"
					aria-label="Copy code"
					title={copied ? "Copied!" : "Copy code"}
				>
					{copied ? (
						<Check className="h-3.5 w-3.5" />
					) : (
						<Copy className="h-3.5 w-3.5" />
					)}
				</button>
			</div>
			<div className="overflow-x-auto relative">
				<style>{`
					.syntax-highlighter-with-gutter > div {
						position: relative;
					}
					.syntax-highlighter-with-gutter > div::before {
						content: '';
						position: absolute;
						left: 0;
						top: 0;
						bottom: 0;
						width: 3.5rem;
						background: #fdf6e3;
						border-right: 1px solid #e5d5b2;
						pointer-events: none;
						z-index: 0;
					}
					.syntax-highlighter-with-gutter .linenumber {
						position: sticky !important;
						left: 0 !important;
						padding-right: 1rem !important;
						min-width: 2.5rem !important;
						text-align: right !important;
						user-select: none !important;
						display: inline-block !important;
						z-index: 1 !important;
						position: relative !important;
					}
				`}</style>
				<SyntaxHighlighter
					language={language || "text"}
					style={solarizedlight}
					PreTag="div"
					showLineNumbers
					className="syntax-highlighter-with-gutter"
					customStyle={{
						margin: 0,
						padding: "0.5rem",
						fontSize: "0.8125rem",
						lineHeight: "1.4",
						background: "transparent",
					}}
					codeTagProps={{
						className: "font-mono text-xs",
					}}
				>
					{isExpanded ? code : previewLines}
				</SyntaxHighlighter>
			</div>
			{isLong && !isExpanded && (
				<div className="relative -mt-12 pointer-events-none">
					<div className="h-12 bg-gradient-to-t from-muted/80 to-transparent" />
				</div>
			)}
			{isLong && (
				<div className="border-t border-border/40 bg-muted/50 px-3 py-2 flex justify-center">
					<button
						onClick={() => setIsExpanded(!isExpanded)}
						className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
						aria-label={
							isExpanded
								? "Collapse code block"
								: `Expand code block (${lineCount} lines)`
						}
					>
						{isExpanded ? (
							<>
								Show Less <ChevronUp className="h-3 w-3" />
							</>
						) : (
							<>
								Show More ({lineCount} lines){" "}
								<ChevronDown className="h-3 w-3" />
							</>
						)}
					</button>
				</div>
			)}
		</div>
	);
}
