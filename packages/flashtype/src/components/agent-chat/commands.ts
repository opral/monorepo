export type SlashCommand = {
	name: string; // canonical name without leading '/'
	label: string; // display label including '/'
	aliases?: string[];
	description: string;
};

export const DEFAULT_COMMANDS: SlashCommand[] = [
	{
		name: "clear",
		label: "/clear",
		aliases: ["reset", "new"],
		description: "Clear conversation history and free up context",
	},
	// Future ideas:
	// { name: "config", label: "/config", description: "Open config panel" },
	// { name: "context", label: "/context", description: "Show current context usage" },
];
