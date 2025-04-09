# Lix Agent CLI

An interactive CLI agent for the Lix change control system.

## Overview

Lix Agent is a REPL (read-evaluate-print loop) CLI that allows users to interact with Lix change control files using natural language. The agent leverages large language models (LLMs) to understand user instructions, answer questions about data, and help make modifications to tracked files.

## Features

- **Interactive REPL Interface:** Run the CLI in a terminal as a persistent session for natural language interaction
- **Pluggable LLM Support:** Use different LLM providers (OpenAI GPT, Anthropic Claude, etc.)
- **Dynamic SQL Generation:** Generate and execute SQL queries from natural language questions
- **JavaScript Code Generation:** Generate and execute JavaScript against the Lix API
- **Plugin Support:** Automatically loads and uses specialized plugins for different file types (.csv, .json, etc.)
- **Generalized Agent Architecture:** Agent can operate directly on the Lix object without hard-coded functionality
- **Support for In-Memory and On-Disk Files:** Work with temporary or persistent .lix files
- **Multiple Output Modes:** Human-readable or JSON format for programmatic use

## Installation

```bash
# Clone the repository and install dependencies
git clone https://github.com/opral/monorepo.git
cd monorepo
pnpm install

# Build the agent
cd packages/lix-agent
pnpm build
```

## Usage

Start the CLI:

```bash
# Use the run script
pnpm lix

# With a specific model
pnpm lix -m openai:gpt-4

# With a specific file
pnpm lix -f my-project.lix
```

Or run directly:

```bash
node bin/run.js
```

With options:

```bash
node bin/run.js --model openai:gpt-4 --file my-project.lix
```

## Environment Variables

Before using the agent, set up your API keys:

```bash
# For OpenAI models
export OPENAI_API_KEY=your-api-key-here

# For Anthropic Claude models
export ANTHROPIC_API_KEY=your-api-key-here
```

## Commands

Once in the REPL, you can use these commands:

- `/open <path>` - Open a .lix file (or create if it doesn't exist)
- `/new [path]` - Create a new empty .lix file
- `/save [path]` - Save the current .lix file
- `/close` - Close the current Lix file
- `/mode <human|json>` - Switch output mode
- `/model <n>` - Switch LLM model
- `/plugins` - List available and active plugins
- `/help` - Show help
- `/exit` or `/quit` - Exit the CLI

For any other input, the agent will interpret it as a natural language query or instruction.

## Examples

```
# Open a Lix file
/open project.lix

# Check available plugins
/plugins

# Ask about data
What entries exist in the salaries table?

# Make a change
Update salaries for employees in the engineering department by 10%

# Work with CSV files
Find all employees in the marketing department from the employees.csv file
Add a new employee named John Smith to employees.csv

# Work with JSON files
Update the theme setting in config.json to dark mode
Add a new endpoint to the API configuration in api-settings.json

# Get the schema
What tables and columns exist in this Lix file?

# Save the file
/save
```

## Plugins

The agent automatically loads and uses specialized plugins for different file types:

- **CSV Plugin** (`@lix-js/plugin-csv`): Handles CSV files with features for parsing, modifying, and tracking changes to tabular data.
- **JSON Plugin** (`@lix-js/plugin-json`): Provides specialized handling for JSON files, including parsing, structure modification, and change tracking.

The plugin system is designed to be extensible, with each plugin implementing the `LixPlugin` interface that includes:
- `key`: A unique identifier for the plugin
- `detectChangesGlob`: A glob pattern for which files the plugin handles
- `detectChanges`: A function to detect changes between file versions
- `applyChanges`: A function to apply changes to files

Plugins are automatically loaded based on file extensions when working with files.

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