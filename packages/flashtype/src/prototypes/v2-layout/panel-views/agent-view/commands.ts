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

export const MOCK_FILES = [
	"config.json",
	"fix-cli-create-require.md",
	"incremental-lix-sync.md",
	"parse5-portability.md",
	"sherlock-logging-output.md",
	"sherlock-observe-message-view.md",
	"COMMIT_EDITMSG",
	"config",
	"FETCH_HEAD",
	"HEAD",
	"index",
];
