/**
 * Utility function to have a common error message.
 */
export function lintErrorMessage(args: { expectedSourceToBe: string; expectedTargetToBe: string }): string {
    return `Expected ${args.expectedSourceToBe} but received ${args.expectedTargetToBe}.`;
}
