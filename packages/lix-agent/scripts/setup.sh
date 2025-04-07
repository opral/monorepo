#!/usr/bin/env bash

# Determine the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
MONOREPO_DIR="$(dirname "$(dirname "$(dirname "$PROJECT_DIR")")")"

# Print setup message
echo "Setting up Lix Agent development environment..."
echo "Monorepo directory: $MONOREPO_DIR"
echo "Project directory: $PROJECT_DIR"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "Error: pnpm is not installed"
    echo "Please install pnpm first: npm install -g pnpm"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
cd "$MONOREPO_DIR" && pnpm install

# Build the Lix SDK (required by the agent)
echo "Building Lix SDK..."
cd "$MONOREPO_DIR/lix/packages/lix-sdk" && pnpm run build

# Build the agent
echo "Building Lix Agent..."
cd "$PROJECT_DIR" && pnpm run build

echo "Setup complete!"
echo ""
echo "You can now run the agent with:"
echo "  cd $PROJECT_DIR && pnpm lix"
echo ""
echo "Don't forget to set your API keys:"
echo "  export OPENAI_API_KEY=your-api-key"
echo "  export ANTHROPIC_API_KEY=your-api-key"