import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./code-block";

export function MessageBody({ content }: { content: string }) {
	return (
		<div className="space-y-2">
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={{
					code({ node, inline, className, children, ...props }) {
						const match = /language-(\w+)/.exec(className || "");
						const codeString = String(children).replace(/\n$/, "");
						const language = match ? match[1] : "";

						if (!inline && (match || codeString.includes("\n"))) {
							return <CodeBlock code={codeString} language={language} />;
						}

						return (
							<code
								className="rounded bg-muted/50 px-1.5 py-0.5 text-xs font-mono text-foreground"
								{...props}
							>
								{children}
							</code>
						);
					},
					p({ children }) {
						return <p className="text-sm leading-relaxed">{children}</p>;
					},
					h1({ children }) {
						return (
							<h1 className="text-xl font-semibold leading-tight text-foreground">
								{children}
							</h1>
						);
					},
					h2({ children }) {
						return (
							<h2 className="text-lg font-semibold leading-tight text-foreground">
								{children}
							</h2>
						);
					},
					h3({ children }) {
						return (
							<h3 className="text-base font-semibold leading-tight text-foreground">
								{children}
							</h3>
						);
					},
					h4({ children }) {
						return (
							<h4 className="text-sm font-semibold leading-tight text-foreground">
								{children}
							</h4>
						);
					},
					h5({ children }) {
						return (
							<h5 className="text-sm font-semibold leading-tight text-foreground">
								{children}
							</h5>
						);
					},
					h6({ children }) {
						return (
							<h6 className="text-xs font-semibold leading-tight text-foreground">
								{children}
							</h6>
						);
					},
					a({ href, children }) {
						return (
							<a
								href={href}
								className="font-medium text-primary hover:underline"
								target="_blank"
								rel="noopener noreferrer"
							>
								{children}
							</a>
						);
					},
					ul({ children }) {
						return (
							<ul className="list-disc list-inside space-y-1 text-sm">
								{children}
							</ul>
						);
					},
					ol({ children }) {
						return (
							<ol className="list-decimal list-inside space-y-1 text-sm">
								{children}
							</ol>
						);
					},
					li({ children }) {
						return <li className="leading-relaxed">{children}</li>;
					},
					blockquote({ children }) {
						return (
							<blockquote className="border-l-4 border-border pl-4 italic text-muted-foreground">
								{children}
							</blockquote>
						);
					},
					table({ children }) {
						return (
							<div className="overflow-x-auto">
								<table className="w-full border-collapse text-sm">
									{children}
								</table>
							</div>
						);
					},
					thead({ children }) {
						return <thead className="bg-muted/50">{children}</thead>;
					},
					th({ children }) {
						return (
							<th className="border border-border px-3 py-2 text-left font-semibold">
								{children}
							</th>
						);
					},
					td({ children }) {
						return (
							<td className="border border-border px-3 py-2">{children}</td>
						);
					},
					strong({ children }) {
						return <strong className="font-semibold">{children}</strong>;
					},
					em({ children }) {
						return <em className="italic">{children}</em>;
					},
					hr() {
						return <hr className="border-t border-border my-4" />;
					},
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
