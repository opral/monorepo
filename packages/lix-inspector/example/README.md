# Lix Inspector Demo

This is a demonstration of the Lix Inspector in action. The demo creates a sample Lix database with JSON data and allows you to experiment with the inspector's features.

## Running the Demo

From the lix-inspector package root directory, run:

```bash
# First build the inspector
pnpm build

# Then run the example
pnpm example
```

This will start a development server at http://localhost:3000.

## Features Demonstrated

- **Live Database Inspection**: View all database tables and their current state
- **Change Detection**: See changes as they happen in real-time
- **Version Management**: Create and switch between versions
- **Change Graph Visualization**: View the relationships between changes
- **Performance Metrics**: Monitor query performance and database statistics
- **Time-Travel Debugging**: Navigate through snapshots of the database state
- **Auto-attach Mini-view**: See the mini-view that can be dragged and expanded
- **ProseMirror Integration**: Example of integrating with a ProseMirror-inspired editor

## Test Controls

The demo includes buttons to:

1. **Create Test Changes**: Make modifications to the sample JSON data
2. **Create New Version**: Create a new branch/version of the data
3. **Switch Version**: Toggle between available versions
4. **Change Theme**: Switch between light, dark, and auto themes

## Implementation Details

The demo uses:

- Lix SDK for database operations
- Lix JSON Plugin for handling JSON file format
- Lix Inspector for debugging and visualization
- Vite for bundling and serving the demo

The sample data is a JSON configuration file that gets modified to demonstrate change detection and tracking.