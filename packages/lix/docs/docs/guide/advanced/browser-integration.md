# Browser Integration

Lix is designed to integrate seamlessly with modern web browsers, providing a powerful change control system that runs entirely client-side. This guide covers the key aspects of integrating Lix into browser-based applications.

## Storage Options

Lix supports multiple storage options in the browser:

### In-Memory Storage

The simplest approach is to use in-memory storage, which is useful for temporary sessions or testing:

```typescript
// Create and open a Lix instance in memory
const lixFile = await newLixFile();
const lix = await openLix({
  blob: lixFile,
  providePlugins: [jsonPlugin],
});
```

### File System Access API

For persistent storage with user-controlled files, you can use the File System Access API:

```typescript
// Get a file handle using the File System Access API
const fileHandle = await window.showSaveFilePicker({
  suggestedName: "document.lix",
  types: [
    {
      description: "Lix Files",
      accept: {
        "application/octet-stream": [".lix"],
      },
    },
  ],
});

// Create a new Lix file
const lixFile = await newLixFile();

// Write the initial file
const writable = await fileHandle.createWritable();
await writable.write(lixFile);
await writable.close();

// Open the file
const file = await fileHandle.getFile();
const lix = await openLix({
  fileHandle,
  providePlugins: [jsonPlugin],
});
```

### IndexedDB

For applications that need persistent storage without requiring the user to manage files:

```typescript
// Using a helper library like idb-keyval
import { set, get } from "idb-keyval";

// Save Lix file to IndexedDB
async function saveLixToIDB(lixFile) {
  await set("my-document.lix", lixFile);
}

// Load Lix file from IndexedDB
async function loadLixFromIDB() {
  const lixFile = await get("my-document.lix");
  if (lixFile) {
    return await openLix({
      blob: lixFile,
      providePlugins: [jsonPlugin],
    });
  }
  // Create new file if not found
  const newLixFile = await newLixFile();
  await set("my-document.lix", newLixFile);
  return await openLix({
    blob: newLixFile,
    providePlugins: [jsonPlugin],
  });
}
```

## OPFS (Origin Private File System)

For Chrome and Chromium-based browsers, the Origin Private File System provides a powerful storage option:

```typescript
// Check if OPFS is supported
if ("storage" in navigator && "getDirectory" in navigator.storage) {
  const root = await navigator.storage.getDirectory();
  const fileHandle = await root.getFileHandle("document.lix", { create: true });

  // Create or load Lix file
  let lixFile;
  try {
    const file = await fileHandle.getFile();
    lixFile = await file.arrayBuffer();
  } catch (e) {
    // Create new file if reading fails
    lixFile = await newLixFile();
    const writable = await fileHandle.createWritable();
    await writable.write(lixFile);
    await writable.close();
  }

  // Open Lix with the file
  const lix = await openLix({
    blob: lixFile,
    providePlugins: [jsonPlugin],
  });
}
```

## Web Workers

For improved performance, you can run Lix operations in a Web Worker to avoid blocking the main thread:

### Main Thread

```typescript
// Create a worker
const worker = new Worker("lix-worker.js");

// Send commands to the worker
worker.postMessage({
  type: "CREATE_FILE",
});

// Listen for responses
worker.onmessage = (event) => {
  if (event.data.type === "FILE_CREATED") {
    console.log("Lix file created with ID:", event.data.fileId);
  }
};
```

### Worker Thread (lix-worker.js)

```typescript
// Import Lix in the worker
importScripts("path-to-lix-bundle.js");

// Initialize Lix instance
let lix;

// Handle messages from the main thread
self.onmessage = async (event) => {
  const { type, data } = event.data;

  switch (type) {
    case "CREATE_FILE":
      const lixFile = await newLixFile();
      lix = await openLix({
        blob: lixFile,
        providePlugins: [jsonPlugin],
      });
      self.postMessage({ type: "FILE_CREATED", fileId: lix.id });
      break;

    case "INSERT_FILE":
      const file = await lix.db
        .insertInto("file")
        .values(data)
        .returningAll()
        .executeTakeFirstOrThrow();
      self.postMessage({ type: "FILE_INSERTED", file });
      break;

    // Add more command handlers
  }
};
```

## Auto-saving

Implementing auto-save functionality with Lix:

```typescript
async function setupAutoSave(lix, fileHandle, interval = 5000) {
  let lastSaveTime = Date.now();
  let pendingSave = false;

  // Function to save changes
  async function saveChanges() {
    if (pendingSave) return;

    pendingSave = true;
    try {
      const serialized = await lix.serialize();
      const writable = await fileHandle.createWritable();
      await writable.write(serialized);
      await writable.close();
      lastSaveTime = Date.now();
      console.log("Auto-saved at", new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Auto-save failed:", err);
    } finally {
      pendingSave = false;
    }
  }

  // Set up periodic saving
  const intervalId = setInterval(async () => {
    // Only save if there are unsaved changes
    const hasChanges = await lix.hasUnsavedChanges();
    if (hasChanges) {
      await saveChanges();
    }
  }, interval);

  // Add event listener for page unload
  window.addEventListener("beforeunload", async (event) => {
    const hasChanges = await lix.hasUnsavedChanges();
    if (hasChanges) {
      // Synchronous save before unload
      await saveChanges();
    }
  });

  // Return cleanup function
  return () => clearInterval(intervalId);
}
```

## Browser Compatibility

Lix is compatible with modern browsers that support WebAssembly and other required APIs:

| Browser | Minimum Version | Notes                       |
| ------- | --------------- | --------------------------- |
| Chrome  | 91+             | Full support including OPFS |
| Firefox | 90+             | No OPFS support             |
| Safari  | 15.4+           | Limited OPFS support        |
| Edge    | 91+             | Full support including OPFS |

### Feature Detection

Always use feature detection to ensure compatibility:

```typescript
// Check for File System Access API
const hasFileSystemAccess = "showOpenFilePicker" in window;

// Check for OPFS
const hasOPFS = "storage" in navigator && "getDirectory" in navigator.storage;

// Check for WebAssembly
const hasWasm =
  typeof WebAssembly === "object" &&
  typeof WebAssembly.instantiate === "function";

// Choose appropriate storage strategy based on available features
function chooseStorageStrategy() {
  if (hasFileSystemAccess) {
    return "file-system-access";
  } else if (hasOPFS) {
    return "opfs";
  } else {
    return "indexeddb";
  }
}
```

## Performance Considerations

### Batching Operations

For better performance, batch related operations:

```typescript
// Batch multiple changes in a single transaction
await lix.db.transaction().execute(async (trx) => {
  const snapshot = await trx
    .insertInto("snapshot")
    .values({ created_at: new Date().toISOString() })
    .returningAll()
    .executeTakeFirstOrThrow();

  // Insert multiple changes at once
  await trx
    .insertInto("change")
    .values(
      multipleChanges.map((change) => ({
        ...change,
        snapshot_id: snapshot.id,
      })),
    )
    .execute();
});
```

### Memory Usage

Monitor memory usage when working with large datasets:

```typescript
// Check for performance.memory (Chrome only)
if (performance.memory) {
  console.log(
    "JS Heap Size:",
    performance.memory.usedJSHeapSize / 1048576,
    "MB",
  );
}

// Use FinalizationRegistry to track object cleanup
const registry = new FinalizationRegistry((name) => {
  console.log(`${name} has been garbage collected`);
});

// Register objects for cleanup tracking
registry.register(largeDataObject, "Large data object");
```

## Network Considerations

### Offline Support

Lix works well in offline scenarios, but you should handle synchronization when connectivity is restored:

```typescript
// Listen for online/offline events
window.addEventListener("online", async () => {
  console.log("Connection restored, syncing changes...");
  await syncChangesToServer(lix);
});

window.addEventListener("offline", () => {
  console.log("Connection lost, working in offline mode");
});

// Check initial state
if (navigator.onLine) {
  console.log("Starting in online mode");
} else {
  console.log("Starting in offline mode");
}
```

## Security Considerations

Lix runs entirely client-side, which means sensitive data doesn't need to leave the user's browser. However, consider the following security aspects:

- Use HTTPS to protect data in transit when synchronizing
- Implement proper authentication for server synchronization
- Consider using the Web Crypto API for additional encryption if needed
- Be cautious about which third-party scripts can access your application's data

## Further Reading

- [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
- [Origin Private File System](https://developer.chrome.com/articles/file-system-access/#accessing-the-origin-private-file-system)
- [Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
