/**
 * Mock slash command metadata used by the agent view prototype.
 */
export type SlashCommand = {
	readonly name: string;
	readonly description: string;
};

export const MOCK_COMMANDS: SlashCommand[] = [
	{ name: "clear", description: "Clear the conversation" },
	{ name: "reset", description: "Reset the agent state" },
	{ name: "help", description: "Show available commands" },
];
