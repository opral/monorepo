interface FileContentViewProps {
	readonly fileName: string;
}

/**
 * File content view - Display file contents like Fleet
 */
export function FileContentView({ fileName }: FileContentViewProps) {
	// Mock file content - in a real app this would load from the file system
	const getFileContent = (name: string) => {
		if (name === "writing-style.md") {
			return `# Writing Style Guide

## Voice and Tone

Write in a clear, direct, and professional manner. Avoid unnecessary jargon.

## Structure

- Use short paragraphs
- Include headings for organization
- Use bullet points for lists

## Code Examples

Always include code examples when relevant:

\`\`\`typescript
function example() {
  return "Hello World";
}
\`\`\``;
		} else if (name === "README.md") {
			return `# Project README

Welcome to the project!

## Getting Started

1. Install dependencies: \`npm install\`
2. Run development server: \`npm run dev\`
3. Build for production: \`npm run build\`

## Features

- Modern React with TypeScript
- Fast HMR with Vite
- TailwindCSS for styling`;
		} else if (name === "docs/architecture.mdx") {
			return `# Architecture Overview

## System Design

This application follows a modular architecture with clear separation of concerns.

### Components

- **Layout Shell**: Main container managing panel state
- **Panels**: Resizable containers for views
- **Views**: Individual functional components

## State Management

State is managed at the layout level and passed down through props.`;
		}
		return `# ${name}\n\nFile content goes here...`;
	};

	const content = getFileContent(fileName);

	return (
		<div className="h-full overflow-auto">
			<div className="px-6 py-4">
				<pre className="text-[13px] leading-relaxed text-neutral-900 whitespace-pre-wrap font-mono">
					{content}
				</pre>
			</div>
		</div>
	);
}
