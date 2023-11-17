import { it, expect } from 'vitest';
import { buildCommandAction } from './command.js';
import type { BuildActionArgs } from './command.js';

// List all Node.js APIs that should be forbidden
const forbiddenNodeImports: string[] = [
  'fs',
  'path',
  'os',
  'net',
  'node:fs',
  'node:path',
];

const runTestWithForbiddenImport = async (forbiddenImport: string) => {
  let originalConsoleError: (...data: any[]) => void;
  const errorLogs: string[] = [];

  // Store original console.error and intercept its output
  originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    errorLogs.push(args.join(' '));
  };

  await it(`Should detect forbidden Node.js import: ${forbiddenImport}`, async () => {
    const args: BuildActionArgs = {
      entry: '/commands/module/build/buildCommandAction.ts',
      outdir: './dist',
      watch: false,
    };

    // Generate mock import statements for the forbidden import
    const generateMockFile = (forbiddenImport: string) => {
      return `
        import ${
          forbiddenImport.startsWith('node:') ? forbiddenImport.split(':')[1] : forbiddenImport
        } from "${forbiddenImport.startsWith('node:') ? forbiddenImport.split(':')[1] : forbiddenImport}";

        console.log(${
          forbiddenImport.startsWith('node:') ? forbiddenImport.split(':')[1] : forbiddenImport
        });
      `;
    };

    // Create mockFile content for the forbidden import
    const mockFile = generateMockFile(forbiddenImport);

    // Execute the build command action with the specified arguments and mock file content
    await buildCommandAction({ ...args, mockFile });

    // Check if console.error captured the expected error message
    const errorMessage = `Forbidden Node.js import detected: ${forbiddenImport}`;
    expect(errorLogs.some(log => log.includes(errorMessage))).toBe(true);
  });

  // Restore console.error to its original behavior after tests
  console.error = originalConsoleError;
};

// Run tests for each forbidden import
for (const forbiddenImport of forbiddenNodeImports) {
  runTestWithForbiddenImport(forbiddenImport);
}
