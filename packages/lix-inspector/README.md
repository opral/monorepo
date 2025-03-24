# Lix Inspector

A powerful debugging and visualization tool for Lix SDK.

## Features

- **Live Data Inspection**: View all database tables and their current state in a filterable, searchable interface
- **Event Monitoring**: Real-time event stream showing all actions and mutations with timeline visualization
- **Change Graph Visualization**: Interactive visual representation of change relationships with hierarchical layout
- **Time-Travel Debugging**: Snapshot history with ability to restore previous states for debugging
- **Performance Metrics**: Track SQL query execution, memory usage, and operation timings
- **React Integration**: Easily integrate with React applications using the provided component wrapper
- **Auto-attach Mode**: Optional mini-view that automatically attaches to the document body and expands when clicked
- **Draggable Interface**: Both mini-view and full inspector can be dragged around the screen

## Installation

```bash
npm install @lix-js/inspector
# or
pnpm add @lix-js/inspector
```

## Basic Usage

```typescript
import { openLix } from '@lix-js/sdk';
import { createLixInspector } from '@lix-js/inspector';

// Open a Lix file
const lix = await openLix({ database });

// Create the inspector
const inspector = createLixInspector(lix, {
  theme: 'dark',              // 'light', 'dark', or 'auto'
  autoRefreshInterval: 1000,  // update interval in ms
  maxHistorySize: 50          // max number of history snapshots to keep
});

// Mount it to a DOM element
const container = document.getElementById('inspector-container');
inspector.mount(container);

// Start tracking changes
inspector.startTracking();

// Listen to events
inspector.on('change', (changes) => {
  console.log('Changes detected:', changes);
});

// When done, unmount and clean up
inspector.unmount();
```

## React Integration

### Standard Integration
```tsx
import { LixInspectorComponent } from '@lix-js/inspector';

function MyComponent({ lix }) {
  return (
    <div>
      <h1>Lix Inspector</h1>
      
      <LixInspectorComponent 
        lix={lix} 
        options={{
          theme: 'auto',
          autoRefreshInterval: 2000,
        }}
        style={{ height: '500px' }}
      />
    </div>
  );
}
```

### Auto-attach Mini-view
```tsx
import { LixInspectorComponent } from '@lix-js/inspector';

function EditorWithInspector({ lix }) {
  return (
    <div className="editor-container">
      {/* Your editor or application content */}
      <div className="document-editor">
        {/* Editor content here */}
      </div>
      
      {/* Lix Inspector with auto-attach enabled */}
      <LixInspectorComponent 
        lix={lix} 
        options={{
          theme: 'light',
          autoRefreshInterval: 1000,
          position: 'bottom-right', // Choose from: 'top-left', 'top-right', 'bottom-left', 'bottom-right'
          autoAttach: true, // This creates a draggable mini-view
        }}
      />
    </div>
  );
}
```

## API Reference

### `createLixInspector(lix, options?)`

Creates a new Lix Inspector instance.

**Parameters:**
- `lix` - A Lix instance from `@lix-js/sdk`
- `options` (optional) - Configuration options
  - `theme` - 'light', 'dark', or 'auto' (default: 'light')
  - `autoRefreshInterval` - Update interval in milliseconds (default: 1000)
  - `maxHistorySize` - Maximum number of history snapshots to keep (default: 50)
  - `autoAttach` - Automatically attach to document.body as a mini-view (default: false)
  - `position` - Position of the mini-view: 'top-left', 'top-right', 'bottom-left', 'bottom-right' (default: 'bottom-right')

**Returns:** A `LixInspector` instance.

### `LixInspector` Interface

#### Methods

- `mount(container)` - Mount the inspector to a DOM element
- `unmount()` - Unmount the inspector
- `refresh()` - Manually refresh the inspector data
- `startTracking()` - Start automatic refreshing
- `stopTracking()` - Stop automatic refreshing
- `on(event, callback)` - Subscribe to events
- `off(event, callback)` - Unsubscribe from events

#### Events

- `'change'` - Emitted when changes are detected
- `'conflict'` - Emitted when conflicts are detected
- `'version'` - Emitted when versions change
- `'snapshot'` - Emitted when a new snapshot is created or restored
- `'table-update'` - Emitted when table data is updated

### `LixInspectorComponent` React Component

A React component wrapper for the Lix Inspector.

**Props:**
- `lix` - A Lix instance from `@lix-js/sdk`
- `options` (optional) - Configuration options (same as `createLixInspector`)
- `className` (optional) - Additional CSS class names
- `style` (optional) - Additional CSS styles

## Feature Details

### Auto-attach Mini-view
The mini-view feature provides a non-intrusive way to access the Lix Inspector:
- Automatically attaches to document.body when enabled
- Shows as a small draggable button in one of the corners of the screen
- Expands to full inspector view when clicked
- Updates with summary information about changes and versions
- Shows visual notification when changes occur
- Can be positioned in any corner of the screen
- Automatically cleans up when component unmounts

### Live Data Inspection
View all database tables in your Lix database. Filter, sort, and search through records. The inspector automatically refreshes to show the latest state.

### Change Graph Visualization
The change graph provides a visual representation of relationships between changes. Changes are organized by level in the graph, with arrows showing parent-child relationships. Color coding helps distinguish between different levels in the change hierarchy.

### Time-Travel Debugging
The history tab shows snapshots taken at different points in time. You can:
- Browse through snapshots
- View the state of tables, changes, and versions at any past snapshot
- Restore a snapshot state for debugging purposes
- Navigate through snapshot history with Previous/Next buttons

### Performance Metrics
The metrics tab shows:
- Operation metrics: Count and average execution time for different operations
- SQL query log: Recent queries with execution times
- Memory usage: Database size, table counts, and row counts
- Timing information: Refresh rates and execution times

### Event Monitoring
Track real-time events in your Lix application with:
- Filterable event stream
- Timestamp and event type information
- Event data preview
- Timeline visualization

## Live Demo

This package includes a built-in demo to test the Lix Inspector with a sample Lix database.

To run the demo:

```bash
# Build the inspector
pnpm build

# Start the demo server
pnpm example
```

This will launch a development server with a fully interactive Lix Inspector demo.

See the [example directory](./example/README.md) for more details.

## License

Apache 2.0