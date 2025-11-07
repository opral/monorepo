import dedent from "dedent";

export function buildSystemPrompt(args: {
	basePrompt: string;
	mentionPaths?: string[];
	contextOverlay?: string | null;
}): string {
	const { basePrompt, mentionPaths, contextOverlay } = args;
	const guidance =
		mentionPaths && mentionPaths.length > 0
			? dedent`
					File mentions like @<path> may refer to files in the lix. If helpful, you can call the read_file tool with { path: "<path>" } to inspect content before answering. Only read files when needed.
				`.trim()
			: null;

	const withGuidance = guidance ? `${basePrompt}\n\n${guidance}` : basePrompt;
	return contextOverlay ? `${withGuidance}\n\n${contextOverlay}` : withGuidance;
}
