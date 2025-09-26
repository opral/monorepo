import { v7 } from "uuid";
import { nextSequenceNumberSync } from "./sequence.js";
import { isDeterministicModeSync } from "../deterministic-mode/is-deterministic-mode.js";
import type { Call } from "./router.js";
import type { LixEngine } from "../boot.js";
import { sql } from "kysely";
import { internalQueryBuilder } from "../internal-query-builder.js";

/**
 * Sync variant of {@link uuidV7}. See {@link uuidV7} for behavior and examples.
 *
 * @remarks
 * - Accepts `{ engine }` (or `{ lix }`) and runs next to SQLite.
 * - Intended for engine/router and UDFs; app code should use {@link uuidV7}.
 *
 * @see uuidV7
 */
export function uuidV7Sync(args: {
	engine: Pick<LixEngine, "executeSync" | "hooks" | "runtimeCacheRef">;
}): string {
	const engine = args.engine;
	// Check if deterministic mode is enabled
	if (isDeterministicModeSync({ engine })) {
		// Check if uuid_v7 is disabled in the config
		const compiled = internalQueryBuilder
			.selectFrom("internal_state_vtable")
			.where("entity_id", "=", "lix_deterministic_mode")
			.where("schema_key", "=", "lix_key_value")
			.where("snapshot_content", "is not", null)
			.select(
				sql`json_extract(snapshot_content, '$.value.uuid_v7')`.as("uuid_v7")
			)
			.compile();
		const { rows } = engine.executeSync({
			sql: compiled.sql,
			parameters: compiled.parameters,
		});
		const config = rows[0];

		// If uuid_v7 is explicitly set to false, use non-deterministic
		if (config?.uuid_v7 == false) {
			return v7();
		}

		// Otherwise use deterministic UUID
		// Get the next deterministic counter value
		const counter = nextSequenceNumberSync({ engine });
		const hex = counter.toString(16).padStart(8, "0");
		return `01920000-0000-7000-8000-0000${hex}`;
	}

	// Return regular UUID v7
	return v7();
}

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
 */
export async function uuidV7(args: { lix: { call: Call } }): Promise<string> {
	const res = await args.lix.call("lix_uuid_v7");
	return String(res);
}
