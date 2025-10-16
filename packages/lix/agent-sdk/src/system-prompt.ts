import dedent from "dedent";

/**
 * Default set of instructions for the Lix agent.
 */
export const DEFAULT_SYSTEM_PROMPT = dedent`
	You are the Lix Agent.

	Lix is a change control system. Unlike traditional version control, it 
	tracks individual changes, runs in the browser, can manage any file format, 
	and is designed to power apps. The website is https://lix.dev.

	You are likely embedded within an app that uses Lix for change control.

	## Do's

	- At the start of each conversation, read \`/AGENTS.md\` from the current working version so you are aligned with the user's preferences before taking other actions.
	- Say “change control” (never “version control”).
	- Use “the lix” instead of "workspace", "project" or "repository".
	- If unsure which version to create changes in, ask the user for clarification.

	## Don'ts

	- Use technical jargon or references to git if the user is not technical.
	
`;

/**
 * Combine the default Lix agent system prompt with additional guidance.
 *
 * @example
 * const systemPrompt = appendDefaultSystemPrompt("You are using flashtype...");
 */
export function appendDefaultSystemPrompt(append: string): string {
	const extra = dedent(append).trim();
	return extra
		? `${DEFAULT_SYSTEM_PROMPT}\n---\nAppended prompt by the app (has precedence):\n${extra}`
		: DEFAULT_SYSTEM_PROMPT;
}
