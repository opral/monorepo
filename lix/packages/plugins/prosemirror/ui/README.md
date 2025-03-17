# ProseMirror Plugin Demo UI

This is a simple demo application for the Lix ProseMirror plugin. It demonstrates how to use the plugin to detect changes in a ProseMirror editor.

## Features

- WYSIWYG ProseMirror editor with basic formatting options
- Real-time change detection using the Lix ProseMirror plugin
- Visual display of detected changes (additions, modifications, deletions)

## Getting Started

### Prerequisites

Make sure you have Node.js and npm/pnpm installed.

### Installation

```bash
# Navigate to the UI directory
cd lix/packages/plugins/prosemirror/ui

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The application will start and automatically open in your default browser at `http://localhost:3000`.

## Usage

1. Use the editor to create and edit content:
   - Add headings, lists, blockquotes, and code blocks using the toolbar
   - Make changes to the content to see change detection in action

2. All changes are detected and displayed in the "Change Detection" panel:
   - Green: Added nodes
   - Orange: Modified nodes
   - Red: Deleted nodes

3. Click "Clear Changes" to reset the change history.

## Implementation Details

This demo integrates:

- The Lix SDK with `openLixInMemory` for in-memory file storage
- The ProseMirror Plugin's `detectChanges` function to identify document changes
- A React frontend to visualize the editing experience and change detection

### Key Components

- `Editor.tsx`: Implements the ProseMirror editor with a toolbar
- `ChangesDisplay.tsx`: Displays the detected changes with formatting
- `App.tsx`: Coordinates the application and change detection logic

## License

[MIT](LICENSE)