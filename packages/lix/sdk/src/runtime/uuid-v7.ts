import type { Lix } from "../lix/open-lix.js";

/**
 * Returns a UUID v7.
 *
 * In normal mode, returns a standard time-based UUID v7. In deterministic mode,
 * returns UUIDs with a fixed timestamp prefix and sequential counter suffix.
 *
 * UUID v7 provides better database performance than {@link nanoId} due to time-based sorting,
 * but produces longer IDs that are less suitable for URLs.
 *
 * - Normal mode: standard UUID v7 with current timestamp.
 * - Deterministic mode: fixed prefix "01920000-0000-7000-8800-" + 12-digit hex counter.
 * - Counter state shared with {@link nextSequenceNumberSync}.
 * - Choose UUID v7 for time-sortable database keys; {@link nanoId} for URL-friendly short IDs.
 *
 * @example Normal mode – random UUID v7
 * ```ts
 * const lix = await openLix();
 * const id = await uuidV7({ lix }) // "01920000-5432-7654-8abc-def012345678"
 * ```
 *
 * @example Deterministic mode – sequential UUIDs
 * ```ts
 * const lix = await openLix({
 *   keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true }, lixcol_version_id: "global" }]
 * });
 * await uuidV7({ lix }) // "01920000-0000-7000-8000-000000000000"
 * await uuidV7({ lix }) // "01920000-0000-7000-8000-000000000001"
 * await uuidV7({ lix }) // "01920000-0000-7000-8000-000000000002"
 * ```
 *
 * @example Database operations
 * ```ts
 * await lix.db
 *   .insertInto("change")
 *   .values({ id: await uuidV7({ lix }), content: "Updated user profile" })
 *   .execute();
 * ```
 */
export async function uuidV7(args: {
	/** Lix instance exposing the runtime call boundary. */
	lix: {
		call: (
			name: string,
			payload?: unknown,
			opts?: { signal?: AbortSignal }
		) => Promise<unknown>;
	};
}): Promise<string> {
	const res = await args.lix.call("lix_uuid_v7");
	return String(res);
}

export default uuidV7;
