# Lix Agent CLI

An interactive CLI agent for the Lix change control system.

## Overview

Lix Agent is a REPL (read-evaluate-print loop) CLI that allows users to interact with Lix change control files using natural language. The agent leverages large language models (LLMs) to understand user instructions, answer questions about changes, and help make modifications to tracked files.

## Features

- **Interactive REPL Interface:** Run the CLI in a terminal as a persistent session for natural language interaction
- **Pluggable LLM Support:** Use different LLM providers (OpenAI GPT, Anthropic Claude, etc.)
- **Node.js Implementation:** Built in TypeScript/Node.js with minimal dependencies
- **Dynamic Plugin Loading:** Support various file formats via Lix plugins
- **Support for In-Memory and On-Disk Files:** Work with temporary or persistent .lix files
- **Multiple Output Modes:** Human-readable or JSON format for programmatic use

## Installation

```bash
# Clone the repository and install dependencies
git clone https://github.com/opral/monorepo.git
cd monorepo
pnpm install

# Run the setup script (builds SDK and agent)
cd lix/packages/lix-agent
pnpm run setup

# Optional: Install globally for command-line access
pnpm run install-global
```

## Usage

Start the CLI:

```bash
# Use the run script (will build if needed)
pnpm lix

# With a specific model
pnpm lix openai:gpt-4

# With a specific file
pnpm lix openai:gpt-4 my-project.lix
```

Or run directly:

```bash
pnpm start
```

With options:

```bash
pnpm start --model openai:gpt-4 --file my-project.lix
```

## Environment Variables

Before using the agent, set up your API keys:

```bash
# For OpenAI models
export OPENAI_API_KEY=your-api-key-here

# For Anthropic Claude models
export ANTHROPIC_API_KEY=your-api-key-here
```

The agent uses the official SDKs for each LLM provider:
- OpenAI SDK: `openai`
- Anthropic SDK: `@anthropic-ai/sdk`

## Commands

Once in the REPL, you can use these commands:

- `/open <path>` - Open a .lix file (or create if it doesn't exist)
- `/new [path]` - Create a new empty .lix file
- `/save [path]` - Save the current .lix file
- `/close` - Close the current Lix file
- `/mode <human|json>` - Switch output mode
- `/model <name>` - Switch LLM model
- `/files` - List tracked files
- `/add <path> <content>` - Add a new file to track
- `/backup` - Create a backup of the current Lix file
- `/saveDiff <path>` - Save the last diff to a patch file
- `/help` - Show help
- `/exit` or `/quit` - Exit the CLI

For any other input, the agent will interpret it as a natural language query or instruction.

## Examples

```
# Open a Lix file
/open project.lix

# Ask about changes
What changes were made to config.json last week?

# Make a change
Update the maxUsers setting to 50 in config.json

# Save the file
/save
```

## Development

```bash
# Run tests
pnpm test

# Watch mode for development
pnpm dev

# Run tests with coverage
pnpm test:coverage
```

## License

MIT