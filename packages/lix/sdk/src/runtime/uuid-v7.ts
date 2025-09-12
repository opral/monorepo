import type { Lix } from "../lix/open-lix.js";

/**
 * Async UUIDv7 generator that calls into the runtime boundary.
 *
 * - Always invokes the runtime-owned generator via `lix.callFn('lix_uuid_v7')`.
 * - Agnostic to where the runtime executes (same thread vs Worker).
 *
 * @example
 * // Async usage (recommended)
 * const id = await uuidV7({ lix });
 */
export async function uuidV7(args: {
	/** Lix instance exposing the runtime call boundary. */
	lix: {
		callFn: (
			name: string,
			payload?: unknown,
			opts?: { signal?: AbortSignal }
		) => Promise<unknown>;
	};
}): Promise<string> {
	const res = await args.lix.callFn("lix_uuid_v7");
	return String(res);
}

export default uuidV7;
