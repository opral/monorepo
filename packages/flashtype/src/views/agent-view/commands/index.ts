export type SlashCommand = {
	readonly name: string;
	readonly description: string;
};

export const COMMANDS: SlashCommand[] = [
	{ name: "clear", description: "Clear the conversation" },
	{ name: "reset", description: "Reset the agent state" },
	{ name: "help", description: "Show available commands" },
];

export * from "./clear";
