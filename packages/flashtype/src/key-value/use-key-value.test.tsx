import React from "react";
import { test, expect } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { LixProvider } from "@lix-js/react-utils";
import { openLix } from "@lix-js/sdk";
import { useKeyValue, KeyValueProvider } from "./use-key-value";
import { KEY_VALUE_DEFINITIONS } from "./schema";

test("reads a global, untracked key (left sidebar tab)", async () => {
	const lix = await openLix({});
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>
			<KeyValueProvider defs={KEY_VALUE_DEFINITIONS}>
				<React.Suspense fallback={null}>{children}</React.Suspense>
			</KeyValueProvider>
		</LixProvider>
	);

	// Pre-insert expected value
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "flashtype_left_sidebar_active_tab",
			value: "files",
			lixcol_version_id: "global",
		})
		.execute();

	let hookResult: { current: unknown } = { current: null };

	await act(async () => {
		const { result } = renderHook(
			() => useKeyValue("flashtype_left_sidebar_active_tab"),
			{ wrapper },
		);
		hookResult = result as unknown as { current: unknown };
	});

	await waitFor(() => Array.isArray(hookResult.current as any));

	const [tab] = hookResult.current as any;
	expect(tab).toBe("files");
});

test("writes and reads a global, untracked key (left sidebar tab)", async () => {
	const lix = await openLix({});
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>
			<KeyValueProvider defs={KEY_VALUE_DEFINITIONS}>
				<React.Suspense fallback={null}>{children}</React.Suspense>
			</KeyValueProvider>
		</LixProvider>
	);

	const { result } = renderHook(
		() => useKeyValue("flashtype_left_sidebar_active_tab"),
		{ wrapper },
	);

	// Wait for hook to initialize
	await waitFor(() => Array.isArray(result.current as any));

	await act(async () => {
		await (result.current as any)?.[1]("history");
	});

	await waitFor(() => expect((result.current as any)?.[0]).toBe("history"));

	// Verify DB row persisted to key_value_all with lixcol_version_id = 'global'
	const rows = (await lix.db
		.selectFrom("key_value_all")
		.where("key", "=", "flashtype_left_sidebar_active_tab")
		.where("lixcol_version_id", "=", "global")
		.select(["value"])
		.execute()) as any;
	expect(rows[0]?.value).toBe("history");
});

test("writes and reads a tracked key on active version", async () => {
	const lix = await openLix({});
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>
			<KeyValueProvider defs={KEY_VALUE_DEFINITIONS}>
				<React.Suspense fallback={null}>{children}</React.Suspense>
			</KeyValueProvider>
		</LixProvider>
	);

	const TEST_KEY = "flashtype_test_tracked";

	let hookResult: { current: unknown } = { current: null };
	await act(async () => {
		const { result } = renderHook(() => useKeyValue(TEST_KEY), { wrapper });
		hookResult = result as unknown as { current: unknown };
	});

	// Wait for hook to initialize
	await waitFor(() => Array.isArray(hookResult.current as any));

	await waitFor(() => typeof (hookResult.current as any)[1] === "function");

	await act(async () => {
		await (hookResult.current as any)[1]("hello");
	});

	await waitFor(() => {
		expect((hookResult.current as any)[0]).toBe("hello");
	});

	// Verify DB row persisted to tracked table
	const rows = (await lix.db
		.selectFrom("key_value")
		.where("key", "=", TEST_KEY)
		.select(["value"])
		.execute()) as any;
	expect(rows[0]?.value).toBe("hello");
});
