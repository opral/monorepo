/**
 * Shared origin-relative prefix used for routing LLM traffic through the Worker
 * proxy in development and production.
 *
 * @example
 * fetch(`${LLM_PROXY_PREFIX}/v1beta/models`);
 */
export const LLM_PROXY_PREFIX = "/proxy/llm" as const;
