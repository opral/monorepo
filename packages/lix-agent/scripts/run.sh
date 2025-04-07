#!/usr/bin/env bash

# Determine the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Check if a model is specified
MODEL=${1:-"openai:gpt-4"}
FILE_PATH=$2

# Build the package if it hasn't been built yet
if [ ! -d "$PROJECT_DIR/dist" ]; then
  echo "Building the package..."
  cd "$PROJECT_DIR" && pnpm run build
fi

# Print a welcome message
echo "Starting Lix Agent with model: $MODEL"
echo "-----------------------------------------------"
if [ -n "$FILE_PATH" ]; then
  echo "Opening file: $FILE_PATH"
  node "$PROJECT_DIR/dist/main.js" --model="$MODEL" --file="$FILE_PATH"
else
  node "$PROJECT_DIR/dist/main.js" --model="$MODEL"
fi