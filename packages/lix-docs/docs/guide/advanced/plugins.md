# Working with Plugins

Lix uses a plugin system to provide support for different file formats and data structures. This guide covers how to use existing plugins and create your own custom plugins.

## Understanding Plugins in Lix

Plugins in Lix are responsible for:

1. **Detecting changes** - Comparing old and new versions of a file to identify what changed
2. **Applying changes** - Taking detected changes and applying them to create a new file state
3. **Providing format-specific functionality** - Adding specialized capabilities for specific file formats

## Using Built-in Plugins

Lix comes with several built-in plugins for common file formats:

### JSON Plugin

For working with JSON files and objects:

```typescript
import { jsonPlugin } from '@lix-js/plugin-json';

const lix = await openLixInMemory({
  blob: lixFile,
  providePlugins: [jsonPlugin],
});

// Insert a JSON file
const file = await lix.db
  .insertInto('file')
  .values({
    path: '/config.json',
    data: new TextEncoder().encode(JSON.stringify({ 
      name: 'My Project',
      version: '1.0.0',
      settings: {
        maxUsers: 10,
        theme: 'light'
      }
    })),
  })
  .returningAll()
  .executeTakeFirstOrThrow();

// Update the JSON data
const updatedData = {
  name: 'My Project',
  version: '1.0.1',  // Changed version
  settings: {
    maxUsers: 20,    // Changed maxUsers
    theme: 'dark'    // Changed theme
  }
};

// Update the file with new content
await lix.updateFile({
  fileId: file.id,
  data: new TextEncoder().encode(JSON.stringify(updatedData)),
});

// Get the detected changes
const changes = await lix.db
  .selectFrom('change')
  .where('file_id', '=', file.id)
  .select(['path', 'from_value', 'to_value'])
  .execute();

// Changes will include:
// - version: '1.0.0' -> '1.0.1'
// - settings.maxUsers: 10 -> 20
// - settings.theme: 'light' -> 'dark'
```

### CSV Plugin

For working with tabular data in CSV format:

```typescript
import { csvPlugin } from '@lix-js/plugin-csv';

const lix = await openLixInMemory({
  blob: lixFile,
  providePlugins: [csvPlugin],
});

// Insert a CSV file
const csvContent = `Name,Age,City
Alice,30,New York
Bob,25,Los Angeles
Charlie,35,Chicago`;

const file = await lix.db
  .insertInto('file')
  .values({
    path: '/users.csv',
    data: new TextEncoder().encode(csvContent),
  })
  .returningAll()
  .executeTakeFirstOrThrow();

// Update the CSV data
const updatedCsvContent = `Name,Age,City
Alice,31,New York
Bob,25,San Francisco
Charlie,35,Chicago`;

// Update the file with new content
await lix.updateFile({
  fileId: file.id,
  data: new TextEncoder().encode(updatedCsvContent),
});

// Get the detected changes
const changes = await lix.db
  .selectFrom('change')
  .where('file_id', '=', file.id)
  .select(['metadata', 'from_value', 'to_value'])
  .execute();

// Changes will include:
// - Row 1, column Age: 30 -> 31
// - Row 2, column City: Los Angeles -> San Francisco
```

### Markdown Plugin

For working with Markdown documents:

```typescript
import { markdownPlugin } from '@lix-js/plugin-md';

const lix = await openLixInMemory({
  blob: lixFile,
  providePlugins: [markdownPlugin],
});

// Insert a Markdown file
const mdContent = `# My Document

This is a paragraph.

- List item 1
- List item 2

## Section 1

More content here.`;

const file = await lix.db
  .insertInto('file')
  .values({
    path: '/document.md',
    data: new TextEncoder().encode(mdContent),
  })
  .returningAll()
  .executeTakeFirstOrThrow();

// Update the Markdown data
const updatedMdContent = `# My Updated Document

This is an updated paragraph.

- List item 1
- List item 2
- List item 3

## Section 1

More content here with additions.`;

// Update the file with new content
await lix.updateFile({
  fileId: file.id,
  data: new TextEncoder().encode(updatedMdContent),
});

// Get the detected changes at block level
const changes = await lix.db
  .selectFrom('change')
  .where('file_id', '=', file.id)
  .select(['metadata', 'from_value', 'to_value'])
  .execute();
```

## Using Multiple Plugins

You can register multiple plugins to handle different file types:

```typescript
import { jsonPlugin } from '@lix-js/plugin-json';
import { csvPlugin } from '@lix-js/plugin-csv';
import { markdownPlugin } from '@lix-js/plugin-md';

const lix = await openLixInMemory({
  blob: lixFile,
  providePlugins: [jsonPlugin, csvPlugin, markdownPlugin],
});

// Lix will select the appropriate plugin based on file extension
```

## Plugin Selection

Lix selects the appropriate plugin based on several criteria:

1. **File extension** - Matching the file's extension with supported extensions
2. **Content-based detection** - Analyzing the file content to determine the format
3. **Explicit selection** - Using a specific plugin when requested

You can explicitly specify which plugin to use:

```typescript
// Force using JSON plugin regardless of file extension
await lix.updateFile({
  fileId: file.id,
  data: newData,
  pluginName: 'json',
});
```

## Creating Custom Plugins

You can create custom plugins to support additional file formats or specialized data structures.

### Plugin Structure

A Lix plugin consists of at least two core functions:

1. `detectChanges()` - Compares old and new content to identify changes
2. `applyChanges()` - Takes a set of changes and applies them to create new content

Here's a simplified example of a custom plugin for a hypothetical "notes" format:

```typescript
// notes-plugin.ts
import { LixPlugin } from '@lix-js/sdk';

// Define the structure of our changes
interface NoteChange {
  type: 'create' | 'update' | 'delete';
  id: string;
  title?: string;
  content?: string;
}

// Create the plugin
export const notesPlugin: LixPlugin = {
  name: 'notes',
  fileExtensions: ['.notes'],
  contentTypes: ['application/x-notes'],
  
  // Detect changes between two versions
  async detectChanges({ oldContent, newContent }) {
    // Parse the content
    const oldNotes = oldContent ? JSON.parse(new TextDecoder().decode(oldContent)) : [];
    const newNotes = newContent ? JSON.parse(new TextDecoder().decode(newContent)) : [];
    
    const changes: NoteChange[] = [];
    
    // Find deleted and updated notes
    for (const oldNote of oldNotes) {
      const newNote = newNotes.find(n => n.id === oldNote.id);
      if (!newNote) {
        // Note was deleted
        changes.push({
          type: 'delete',
          id: oldNote.id,
        });
      } else if (
        oldNote.title !== newNote.title || 
        oldNote.content !== newNote.content
      ) {
        // Note was updated
        changes.push({
          type: 'update',
          id: oldNote.id,
          title: newNote.title,
          content: newNote.content,
        });
      }
    }
    
    // Find created notes
    for (const newNote of newNotes) {
      const oldNote = oldNotes.find(n => n.id === newNote.id);
      if (!oldNote) {
        // Note was created
        changes.push({
          type: 'create',
          id: newNote.id,
          title: newNote.title,
          content: newNote.content,
        });
      }
    }
    
    return changes;
  },
  
  // Apply changes to create new content
  async applyChanges({ oldContent, changes }) {
    // Parse the content
    const notes = oldContent ? JSON.parse(new TextDecoder().decode(oldContent)) : [];
    
    // Apply each change
    for (const change of changes) {
      if (change.type === 'create') {
        notes.push({
          id: change.id,
          title: change.title,
          content: change.content,
        });
      } else if (change.type === 'update') {
        const noteIndex = notes.findIndex(n => n.id === change.id);
        if (noteIndex !== -1) {
          notes[noteIndex] = {
            ...notes[noteIndex],
            title: change.title ?? notes[noteIndex].title,
            content: change.content ?? notes[noteIndex].content,
          };
        }
      } else if (change.type === 'delete') {
        const noteIndex = notes.findIndex(n => n.id === change.id);
        if (noteIndex !== -1) {
          notes.splice(noteIndex, 1);
        }
      }
    }
    
    // Serialize the updated content
    return new TextEncoder().encode(JSON.stringify(notes));
  },
};
```

### Using Custom Plugins

Register your custom plugin the same way as built-in plugins:

```typescript
import { notesPlugin } from './notes-plugin';

const lix = await openLixInMemory({
  blob: lixFile,
  providePlugins: [notesPlugin],
});

// You can now work with .notes files
const notesData = [
  { id: '1', title: 'Meeting notes', content: 'Discuss project timeline' },
  { id: '2', title: 'Ideas', content: 'New feature concepts' }
];

const file = await lix.db
  .insertInto('file')
  .values({
    path: '/my-notes.notes',
    data: new TextEncoder().encode(JSON.stringify(notesData)),
  })
  .returningAll()
  .executeTakeFirstOrThrow();
```

## Advanced Plugin Features

### Custom Conflict Resolution

You can implement custom conflict resolution logic in your plugin:

```typescript
// Inside your plugin definition
async detectConflicts({ baseContent, ourContent, theirContent, ourChanges, theirChanges }) {
  // Compare changes to identify conflicts
  const conflicts = [];
  
  for (const ourChange of ourChanges) {
    for (const theirChange of theirChanges) {
      if (ourChange.id === theirChange.id && 
          (ourChange.title !== theirChange.title || 
           ourChange.content !== theirChange.content)) {
        conflicts.push({
          id: ourChange.id,
          ours: ourChange,
          theirs: theirChange,
        });
      }
    }
  }
  
  return conflicts;
},

async resolveConflicts({ conflicts, resolution }) {
  // Apply conflict resolutions based on user choices
  const resolvedChanges = [];
  
  for (const conflict of conflicts) {
    if (resolution[conflict.id] === 'ours') {
      resolvedChanges.push(conflict.ours);
    } else if (resolution[conflict.id] === 'theirs') {
      resolvedChanges.push(conflict.theirs);
    } else if (resolution[conflict.id] === 'merge') {
      // Custom merge logic
      resolvedChanges.push({
        type: 'update',
        id: conflict.id,
        title: `${conflict.ours.title} / ${conflict.theirs.title}`,
        content: `${conflict.ours.content}\n\n---\n\n${conflict.theirs.content}`,
      });
    }
  }
  
  return resolvedChanges;
}
```

### Plugin Metadata

You can provide additional metadata for your plugin:

```typescript
const myPlugin: LixPlugin = {
  name: 'my-custom-plugin',
  fileExtensions: ['.custom'],
  contentTypes: ['application/x-custom'],
  
  // Plugin metadata
  version: '1.0.0',
  author: 'Your Name',
  description: 'A custom plugin for handling specialized data',
  homepage: 'https://github.com/yourusername/my-custom-plugin',
  
  // Core functionality
  async detectChanges() { /* ... */ },
  async applyChanges() { /* ... */ },
  
  // Optional utilities
  utilities: {
    validateContent(content) {
      // Custom validation logic
      try {
        const data = JSON.parse(new TextDecoder().decode(content));
        return { valid: true };
      } catch (e) {
        return { valid: false, error: 'Invalid format' };
      }
    },
    
    formatContent(content) {
      // Pretty-print or format the content
      const data = JSON.parse(new TextDecoder().decode(content));
      return new TextEncoder().encode(JSON.stringify(data, null, 2));
    }
  }
};
```

## Plugin Best Practices

1. **Performance**: Optimize your plugin for large files and frequent changes
2. **Granularity**: Detect changes at the appropriate level of granularity
3. **Robustness**: Handle edge cases and invalid inputs gracefully
4. **Determinism**: Ensure that applying the same changes always produces the same result
5. **Typing**: Use TypeScript interfaces to define your change objects
6. **Testing**: Thoroughly test your plugin with real-world data and edge cases

## Further Reading

- [JSON Plugin Documentation](/plugins/json)
- [CSV Plugin Documentation](/plugins/csv)
- [Markdown Plugin Documentation](/plugins/markdown)
- [Creating Custom Plugins](/plugins/creating-plugins)