/**
 * Environment detection utilities
 * Helps determine if code is running in browser or Node.js
 */

/**
 * Check if code is running in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

/**
 * Check if code is running in a Node.js environment
 */
export function isNode(): boolean {
  return typeof process !== 'undefined' && 
    process.versions != null && 
    process.versions.node != null;
}

/**
 * Check if code is running in a test environment
 */
export function isTest(): boolean {
  return typeof process !== 'undefined' && 
    !!process.env &&
    !!(process.env.NODE_ENV === 'test' || process.env.VITEST);
}

/**
 * Get a safe console for the current environment
 */
export function getSafeConsole() {
  if (isBrowser()) {
    // In browser, return the window.console
    return window.console;
  } else if (isNode() || isTest()) {
    // In Node, return process.stdout/stderr wrapped as console-like
    return console;
  } else {
    // Fallback to a no-op console
    return {
      log: () => {},
      error: () => {},
      warn: () => {},
      info: () => {}
    };
  }
}