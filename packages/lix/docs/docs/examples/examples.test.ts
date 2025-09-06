import { describe, test, expect, vi, beforeAll } from "vitest";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Utility to import a file with fresh module evaluation
async function importFresh(filePath: string) {
  // Use a timestamp query parameter to bypass module cache
  const timestamp = Date.now() + Math.random();
  return import(`${filePath}?t=${timestamp}`);
}

describe("Documentation Examples", () => {
  let exampleFiles: string[] = [];

  beforeAll(async () => {
    const files = await readdir(__dirname);
    exampleFiles = files.filter(
      (file) => file.endsWith(".ts") && !file.includes(".test."),
    );
  });

  test("all example files should not throw when executed", async () => {
    // Mock the global console to suppress output during test
    const originalConsole = { ...console };
    const mockConsole = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    };
    Object.assign(console, mockConsole);

    try {
      for (const file of exampleFiles) {
        const filePath = join(__dirname, file);

        // Dynamic import of the example module
        const module = await import(filePath);

        // Run the example function if it exists
        if (typeof module.default === "function") {
          // Should not throw
          await expect(module.default(mockConsole)).resolves.not.toThrow();
        }
      }
    } finally {
      // Restore original console
      Object.assign(console, originalConsole);
    }
  });

  test("all example files should not log on import", async () => {
    // Test each file in isolation by checking the file content
    for (const file of exampleFiles) {
      const filePath = join(__dirname, file);
      const content = await readFile(filePath, 'utf-8');
      
      // Check if runExample is uncommented
      const lines = content.split('\n');
      const hasUncommentedRunExample = lines.some((line, index) => {
        const trimmedLine = line.trim();
        // Skip if it's the function definition
        if (trimmedLine.includes('function runExample')) {
          return false;
        }
        // Check if line contains runExample( and is not commented
        if (line.includes('runExample(') && !trimmedLine.startsWith('//')) {
          return true;
        }
        return false;
      });
      
      if (hasUncommentedRunExample) {
        throw new Error(`File ${file} has uncommented runExample() call - it should be commented out with // to prevent logging during import`);
      }
    }
  });
});
