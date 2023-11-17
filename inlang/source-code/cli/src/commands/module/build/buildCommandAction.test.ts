import { it, expect } from 'vitest';
import { buildCommandAction } from './command.js';
import type { BuildActionArgs } from './command.js';

// List all Node.js APIs that should be forbidden
const forbiddenNodeImports: string[] = [
  'fs',
  'path',
  'os',
  'net',
];

it('Forbidden Node.js API Detection', async () => {
  let originalConsoleError: (...data: any[]) => void;
  const errorLogs: string[] = [];

  // Store original console.error and intercept its output
  originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    errorLogs.push(args.join(' '));
  };

  for (const forbiddenImport of forbiddenNodeImports) {
    await it(`Should detect forbidden Node.js import: ${forbiddenImport}`, async () => {
      const args: BuildActionArgs = {
        entry: 'testEntry.js', // Replace with an actual entry file path
        outdir: './dist',
        watch: false,
      };

      // Execute the build command action with the current forbidden import
      await buildCommandAction(args);

      // Check if console.error captured the expected error message
      const errorMessage = `Forbidden Node.js import detected: ${forbiddenImport}`;
      expect(errorLogs.some(log => log.includes(errorMessage))).toBe(true);
    });
  }

  // Restore console.error to its original behavior after tests
  console.error = originalConsoleError;
});
