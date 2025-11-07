/**
 * Development-only OpenRouter API key. When present, the Lix agent view
 * should prefer this key over user-supplied credentials. This makes it easier
 * to run the agent locally without manual setup.
 *
 * @example
 * if (VITE_DEV_OPENROUTER_API_KEY) {
 * 	console.log("Using dev key");
 * }
 */
export const VITE_DEV_OPENROUTER_API_KEY: string | undefined = import.meta.env
	?.VITE_DEV_OPENROUTER_API_KEY;
