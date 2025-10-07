import React from "react";
import { test, expect } from "vitest";
import {
	render,
	renderHook,
	screen,
	waitFor,
	act,
} from "@testing-library/react";
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

	let resultRef: { current: unknown } = { current: null };
	await act(async () => {
		const { result } = renderHook(
			() => useKeyValue("flashtype_left_sidebar_active_tab"),
			{ wrapper },
		);
		resultRef = result as unknown as { current: unknown };
	});

	// Wait for hook to initialize
	await waitFor(() => Array.isArray(resultRef.current as any));

	await act(async () => {
		await (resultRef.current as any)?.[1]("history");
	});

	await waitFor(() => expect((resultRef.current as any)?.[0]).toBe("history"));

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

test("shows Suspense fallback first, then renders value on initial read", async () => {
	const lix = await openLix({});
	// Ensure the key exists so the initial load resolves deterministically
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "flashtype_left_sidebar_active_tab",
			value: "files",
			lixcol_version_id: "global",
		})
		.execute();
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>
			<KeyValueProvider defs={KEY_VALUE_DEFINITIONS}>
				<React.Suspense fallback={<div data-testid="fb">loading</div>}>
					{children}
				</React.Suspense>
			</KeyValueProvider>
		</LixProvider>
	);

	function ReadKV() {
		const [val] = useKeyValue("flashtype_left_sidebar_active_tab");
		return <div data-testid="val">{String(val)}</div>;
	}

	await act(async () => {
		render(<ReadKV />, { wrapper });
	});
	// Eventually value appears once Suspense resolves
	const el = await screen.findByTestId("val");
	expect(el.textContent).toBe("files");
});

test("re-renders when key value changes externally", async () => {
	const lix = await openLix({});
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>
			<KeyValueProvider defs={KEY_VALUE_DEFINITIONS}>
				<React.Suspense fallback={null}>{children}</React.Suspense>
			</KeyValueProvider>
		</LixProvider>
	);

	const TEST_KEY = "flashtype_test_tracked_external";

	let resultRef: { current: unknown } = { current: null };
	await act(async () => {
		const { result } = renderHook(() => useKeyValue(TEST_KEY), { wrapper });
		resultRef = result as unknown as { current: unknown };
	});
	// wait for initial suspense resolution
	await waitFor(() => Array.isArray(resultRef.current as any));

	// set initial value via hook
	await act(async () => {
		await (resultRef.current as any)[1]("initial");
	});
	await waitFor(() => expect((resultRef.current as any)[0]).toBe("initial"));

	// mutate externally (simulate another part of app)
	await act(async () => {
		await lix.db
			.updateTable("key_value")
			.set({ value: "external" })
			.where("key", "=", TEST_KEY)
			.execute();
	});

	// observe re-render with new value
	await waitFor(() => expect((resultRef.current as any)[0]).toBe("external"));
});

test("memoized children should not re-render when parent state changes", async () => {
	const lix = await openLix({});
	await lix.db
		.insertInto("key_value_all")
		.values({
			key: "flashtype_left_sidebar_active_tab",
			value: "files",
			lixcol_version_id: "global",
		})
		.execute();

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>
			<KeyValueProvider defs={KEY_VALUE_DEFINITIONS}>
				<React.Suspense fallback={null}>{children}</React.Suspense>
			</KeyValueProvider>
		</LixProvider>
	);

	let childRenders = 0;

	const MemoChild = React.memo(function MemoChild({
		pair,
	}: {
		pair: ReturnType<typeof useKeyValue>;
	}) {
		childRenders++;
		return <div data-testid="current-tab">{String(pair[0] ?? "unknown")}</div>;
	});

	function Parent() {
		const pair = useKeyValue("flashtype_left_sidebar_active_tab", {
			defaultVersionId: "global",
			untracked: true,
		});
		const [, forceRender] = React.useState(0);
		return (
			<>
				<MemoChild pair={pair} />
				<button
					type="button"
					onClick={() => forceRender((n) => n + 1)}
					data-testid="rerender-trigger"
				>
					Rerender
				</button>
			</>
		);
	}

	await act(async () => {
		render(<Parent />, { wrapper });
	});

	await screen.findByTestId("current-tab");
	await waitFor(() => expect(childRenders).toBeGreaterThan(0));
	const baseline = childRenders;

	const button = screen.getByTestId("rerender-trigger");
	await act(async () => {
		button.click();
	});

	await waitFor(() => expect(childRenders).toBe(baseline));
});
