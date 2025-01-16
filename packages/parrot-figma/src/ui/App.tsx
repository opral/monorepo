import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "@ui/assets/vite.svg?url";
import "./App.css";

async function handleFile() {
  try {
    // Access the OPFS root directory
    const root = await navigator.storage.getDirectory();

    // File name to work with
    const fileName = "counter.txt";

    // Try to get the file handle, or create it if it doesn't exist
    let fileHandle;
    try {
      fileHandle = await root.getFileHandle(fileName, { create: false });
    } catch (e) {
      if ((e as any).name === "NotFoundError") {
        fileHandle = await root.getFileHandle(fileName, { create: true });
      } else {
        throw e;
      }
    }

    // Open the file for reading and writing
    const writable = await fileHandle.createWritable();
    let content = 0;

    // Check if the file already has data
    const file = await fileHandle.getFile();
    const text = await file.text();

    if (text) {
      content = parseInt(text, 10); // Read the existing number
    }

    content++; // Increment the number

    // Write the updated number back to the file
    await writable.write(String(content));
    await writable.close();

    // Log the result
    console.log(`Updated value: ${content}`);
  } catch (error) {
    console.error("Error handling the file:", error);
  }
}

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React - Hello Opral</h1>
      <div className="card">
        <button
          onClick={() => {
            handleFile();
            setCount((count) => count + 1);
          }}
        >
          count is {count}x
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
