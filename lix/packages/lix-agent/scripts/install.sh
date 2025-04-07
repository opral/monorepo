#!/usr/bin/env bash

# Determine the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Print setup message
echo "Installing Lix Agent CLI globally..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "Error: pnpm is not installed"
    echo "Please install pnpm first: npm install -g pnpm"
    exit 1
fi

# Install globally
echo "Creating global symlink..."
cd "$PROJECT_DIR" && pnpm link --global

echo "Lix Agent installed globally!"
echo "You can now use the 'lix-agent' command from anywhere."
echo ""
echo "Don't forget to set your API keys:"
echo "  export OPENAI_API_KEY=your-api-key"
echo "  export ANTHROPIC_API_KEY=your-api-key"