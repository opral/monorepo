import type { Lix } from "@lix-js/sdk";
import { useLix, useQuery } from "@lix-js/react-utils";
import {
	type KeyDef,
	type ValueOf,
	type KnownKey,
	KEY_VALUE_DEFINITIONS,
} from "./schema";
import { createContext, useContext, createElement } from "react";
import type React from "react";

type KVDefs = Record<string, KeyDef<any>>;
const KVDefsContext = createContext<KVDefs | null>(null);

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
export function useKeyValue<K extends KnownKey>(
	key: K,
	opts?: UseKeyValueOptions,
): readonly [ValueOf<K> | null, (newValue: ValueOf<K>) => Promise<void>];
export function useKeyValue<K extends string>(
	key: Exclude<K, KnownKey>,
	opts?: UseKeyValueOptions,
): readonly [unknown | null, (newValue: unknown) => Promise<void>];

export function useKeyValue<K extends string>(
	key: K,
	opts?: UseKeyValueOptions,
) {
	const lix = useLix();
	const providedDefs =
		useContext(KVDefsContext) ?? (KEY_VALUE_DEFINITIONS as KVDefs);
	const d = getDefaults(key as string, providedDefs);
	const defaultVersionId = opts?.defaultVersionId ?? d.defaultVersionId;
	const untracked = opts?.untracked ?? d.untracked;

	type T = ValueOf<K>;

	const rows = useQuery((lix) =>
		selectValue(lix, key, { defaultVersionId, untracked }),
	);
	const value = (rows[0]?.value ??
		(providedDefs as any)[key]?.defaultValue ??
		null) as T | null;

	const setValue = async (newValue: T) => {
		await upsertValue(lix, key, newValue, { defaultVersionId, untracked });
	};

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
				.set({ value })
				.where("key", "=", key)
				.where("lixcol_version_id", "=", versionId)
				.execute();
		} else {
			await lix.db
				.insertInto("key_value_all")
				.values({ key, value, lixcol_version_id: versionId })
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
