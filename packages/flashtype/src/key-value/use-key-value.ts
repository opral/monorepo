import type { Lix } from "@lix-js/sdk";
import { useLix, useQuery } from "@lix-js/react-utils";
import {
	type KeyDef,
	type ValueOf,
	type KnownKey,
	KEY_VALUE_DEFINITIONS,
} from "./schema";
import { createContext, useContext, createElement, useCallback } from "react";
import type React from "react";

type KVDefs = Record<string, KeyDef<any>>;
const KVDefsContext = createContext<KVDefs | null>(null);

/**
 * Provides key-value definitions to `useKeyValue` within a React subtree.
 *
 * Pass in a map of key definitions (version scope, tracking, defaults) so the
 * hook can infer behavior for known keys.
 *
 * @example
 * const lix = await openLix({})
 * render(
 *   <LixProvider lix={lix}>
 *     <KeyValueProvider defs={KEY_VALUE_DEFINITIONS}>
 *       <App />
 *     </KeyValueProvider>
 *   </LixProvider>
 * )
 */
export function KeyValueProvider({
	defs,
	children,
}: {
	defs: KVDefs;
	children: React.ReactNode;
}) {
	// oxlint-disable-next-line no-children-prop
	return createElement(KVDefsContext.Provider, { value: defs, children });
}

/**
 * Options passed to `useKeyValue` to override defaults for a specific key.
 */
export type UseKeyValueOptions = {
	defaultVersionId?: "active" | "global" | string;
	untracked?: boolean;
};

function getDefaults(
	key: string,
	defs: Record<string, KeyDef<any>>,
): {
	defaultVersionId: "active" | "global" | string;
	untracked: boolean;
} {
	const def = defs[key];
	if (def) return def;
	// Lix defaults: active version, tracked (untracked=false)
	return { defaultVersionId: "active", untracked: false };
}

// Overloads for strong typing on known keys
// default hook is suspense-enabled

// Scope Suspense runtime caches per Lix instance.
// Note: Using the Lix handle itself as the WeakMap key ensures stable identity
// across renders. Some Lix implementations may expose `.sqlite` as a new object
// on each access; keying by that would cause the Suspense promise to be thrown
// repeatedly and never resolve. Keying by `lix` avoids that pitfall.
type KvRuntime = {
	loadedOnce: Set<string>;
	loadPromises: Map<string, Promise<void>>;
};
const kvRuntimeByLix = new WeakMap<Lix, KvRuntime>();

function getKvRuntime(lix: Lix): KvRuntime {
	let rt = kvRuntimeByLix.get(lix);
	if (!rt) {
		rt = {
			loadedOnce: new Set<string>(),
			loadPromises: new Map<string, Promise<void>>(),
		};
		kvRuntimeByLix.set(lix, rt);
	}
	return rt;
}

function cacheKeyFor(key: string, versionId: string, untracked: boolean) {
	return `${versionId}|${untracked ? "u" : "t"}|${key}`;
}

/**
 * React hook for reading and writing a key-value setting.
 *
 * - Suspends on first load to ensure deterministic rendering.
 * - Re-renders on live DB updates via `useQuery` subscription.
 * - Honors per-key defaults from `KeyValueProvider` or built-in schema.
 *
 * @example
 * function SidebarTab() {
 *   const [tab, setTab] = useKeyValue('flashtype_left_sidebar_active_tab')
 *   return (
 *     <button onClick={() => setTab('history')}>{tab ?? 'loading'}</button>
 *   )
 * }
 */
export function useKeyValue<K extends KnownKey>(
	key: K,
	opts?: UseKeyValueOptions,
): readonly [ValueOf<K> | null, (newValue: ValueOf<K>) => Promise<void>];
export function useKeyValue<K extends string>(
	key: K,
	opts?: UseKeyValueOptions,
): readonly [ValueOf<K> | null, (newValue: ValueOf<K>) => Promise<void>] {
	const lix = useLix();
	const providedDefs =
		useContext(KVDefsContext) ?? (KEY_VALUE_DEFINITIONS as KVDefs);
	const d = getDefaults(key as string, providedDefs);
	const defaultVersionId = opts?.defaultVersionId ?? d.defaultVersionId;
	const untracked = opts?.untracked ?? d.untracked;

	const ck = cacheKeyFor(key as string, String(defaultVersionId), untracked);
	const { loadedOnce, loadPromises } = getKvRuntime(lix);
	// Subscribe to live updates to ensure re-renders on changes
	const rows = useQuery(({ lix }) =>
		selectValue(lix, key as string, {
			defaultVersionId: String(defaultVersionId),
			untracked,
		}),
	);
	const defVal = (providedDefs as any)[key]?.defaultValue ?? null;
	const value = (
		rows && rows[0]?.value !== undefined ? rows[0]?.value : defVal
	) as ValueOf<K> | null;

	if (!loadedOnce.has(ck)) {
		// Kick a one-time loader to gate the first render behind Suspense
		let p = loadPromises.get(ck);
		if (!p) {
			p = selectValue(lix, key as string, {
				defaultVersionId: String(defaultVersionId),
				untracked,
			})
				.execute()
				.then(() => {
					loadedOnce.add(ck);
					loadPromises.delete(ck);
				})
				.catch((e) => {
					loadedOnce.add(ck); // avoid infinite suspend loops on errors
					loadPromises.delete(ck);
					throw e;
				});
			loadPromises.set(ck, p);
		}
		throw p;
	}

	const setValue = useCallback(
		async (newValue: ValueOf<K>) => {
			await upsertValue(lix, key as string, newValue as unknown, {
				defaultVersionId: String(defaultVersionId),
				untracked,
			});
			// Mark as loaded; live subscription (useQuery) will notify consumers
			loadedOnce.add(ck);
		},
		[lix, key, defaultVersionId, untracked, ck, loadedOnce],
	);

	return [value, setValue] as const;
}

function selectValue(
	lix: Lix,
	key: string,
	opts: { defaultVersionId: string; untracked: boolean },
) {
	if (opts.untracked) {
		const versionExpr =
			opts.defaultVersionId === "active"
				? lix.db.selectFrom("active_version").select("version_id")
				: opts.defaultVersionId;
		return lix.db
			.selectFrom("key_value_all")
			.where("lixcol_version_id", "=", versionExpr)
			.where("key", "=", key)
			.select(["value"]);
	}
	// tracked (change-controlled) — supported on active version
	return lix.db
		.selectFrom("key_value")
		.where("key", "=", key)
		.select(["value"]);
}

async function upsertValue<T>(
	lix: Lix,
	key: string,
	value: T,
	opts: { defaultVersionId: string; untracked: boolean },
) {
	if (opts.untracked) {
		let versionId: string;
		if (opts.defaultVersionId === "active") {
			const row = await lix.db
				.selectFrom("active_version")
				.select("version_id")
				.executeTakeFirstOrThrow();
			versionId = row.version_id as unknown as string;
		} else {
			versionId = opts.defaultVersionId;
		}
		// Cannot use UPSERT on a view. Manually check and insert/update.
		const exists = await lix.db
			.selectFrom("key_value_all")
			.where("key", "=", key)
			.where("lixcol_version_id", "=", versionId)
			.select("key")
			.executeTakeFirst();

		if (exists) {
			await lix.db
				.updateTable("key_value_all")
				.set({ value, lixcol_untracked: true })
				.where("key", "=", key)
				.where("lixcol_version_id", "=", versionId)
				.execute();
		} else {
			await lix.db
				.insertInto("key_value_all")
				.values({
					key,
					value,
					lixcol_version_id: versionId,
					lixcol_untracked: true,
				})
				.execute();
		}
		return;
	}
	// tracked (active version)
	const trackedExists = await lix.db
		.selectFrom("key_value")
		.where("key", "=", key)
		.select("key")
		.executeTakeFirst();

	if (trackedExists) {
		await lix.db
			.updateTable("key_value")
			.set({ value })
			.where("key", "=", key)
			.execute();
	} else {
		await lix.db.insertInto("key_value").values({ key, value }).execute();
	}
}
