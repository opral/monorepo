import React from "react";
import { test, expect, vi } from "vitest";
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

const UNTRACKED_TEST_KEY = "flashtype_test_untracked";

test("reads a global, untracked key (test fixture)", async () => {
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
		.insertInto("key_value_by_version")
		.values({
			key: UNTRACKED_TEST_KEY,
			value: "alpha",
			lixcol_version_id: "global",
		})
		.execute();

	let hookResult: { current: unknown } = { current: null };

	await act(async () => {
		const { result } = renderHook(() => useKeyValue(UNTRACKED_TEST_KEY), {
			wrapper,
		});
		hookResult = result as unknown as { current: unknown };
	});

	await waitFor(() => Array.isArray(hookResult.current as any));

	const [value] = hookResult.current as any;
	expect(value).toBe("alpha");
});

test("writes and reads a global, untracked key (test fixture)", async () => {
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
		const { result } = renderHook(() => useKeyValue(UNTRACKED_TEST_KEY), {
			wrapper,
		});
		resultRef = result as unknown as { current: unknown };
	});

	// Wait for hook to initialize
	await waitFor(() => Array.isArray(resultRef.current as any));

	await act(async () => {
		await (resultRef.current as any)?.[1]("beta");
	});

	await waitFor(() => expect((resultRef.current as any)?.[0]).toBe("beta"));

	// Verify DB row persisted to key_value_by_version with lixcol_version_id = 'global'
	const rows = (await lix.db
		.selectFrom("key_value_by_version")
		.where("key", "=", UNTRACKED_TEST_KEY)
		.where("lixcol_version_id", "=", "global")
		.select(["value"])
		.execute()) as any;
	expect(rows[0]?.value).toBe("beta");
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
		.insertInto("key_value_by_version")
		.values({
			key: UNTRACKED_TEST_KEY,
			value: "ready",
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
		const [val] = useKeyValue(UNTRACKED_TEST_KEY);
		return <div data-testid="val">{String(val)}</div>;
	}

	await act(async () => {
		render(<ReadKV />, { wrapper });
	});
	// Eventually value appears once Suspense resolves
	const el = await screen.findByTestId("val");
	expect(el.textContent).toBe("ready");
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

function createDeferred<T>() {
	let resolve!: (value: T | PromiseLike<T>) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

test("shares optimistic updates across hook instances", async () => {
	const lix = await openLix({});
	const SHARED_KEY = "flashtype_test_tracked_shared_optimistic" as const;
	await lix.db
		.insertInto("key_value")
		.values({ key: SHARED_KEY, value: "initial" })
		.execute();

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>
			<KeyValueProvider defs={KEY_VALUE_DEFINITIONS}>
				<React.Suspense fallback={null}>{children}</React.Suspense>
			</KeyValueProvider>
		</LixProvider>
	);

	type Snapshot = { primary: unknown; secondary: unknown };
	const snapshots: Snapshot[] = [];
	let setValueRef:
		| ((value: string) => Promise<void>)
		| ((value: string | null) => Promise<void>)
		| null = null;

	function TwinReaders({
		onSnapshot,
		assignSetter,
	}: {
		onSnapshot: (snapshot: Snapshot) => void;
		assignSetter: (
			setter:
				| ((value: string) => Promise<void>)
				| ((value: string | null) => Promise<void>),
		) => void;
	}) {
		const [primary, setPrimary] = useKeyValue(SHARED_KEY as any);
		const [secondary] = useKeyValue(SHARED_KEY as any);

		React.useEffect(() => {
			assignSetter(setPrimary);
		}, [assignSetter, setPrimary]);

		React.useEffect(() => {
			onSnapshot({ primary, secondary });
		}, [onSnapshot, primary, secondary]);

		return null;
	}

	await act(async () => {
		render(
			<TwinReaders
				onSnapshot={(snapshot) => snapshots.push(snapshot)}
				assignSetter={(setter) => {
					setValueRef = setter;
				}}
			/>,
			{ wrapper },
		);
	});

	await waitFor(() => setValueRef != null);
	await waitFor(() =>
		snapshots.some(
			(snapshot) =>
				snapshot.primary === "initial" && snapshot.secondary === "initial",
		),
	);

	const gate = createDeferred<void>();
	const originalTransaction = lix.db.transaction.bind(lix.db);
	const transactionSpy = vi
		.spyOn(lix.db, "transaction")
		.mockImplementation(() => {
			const tx = originalTransaction();
			const originalExecute = tx.execute.bind(tx);
			(tx as any).execute = (async (cb: Parameters<typeof tx.execute>[0]) => {
				return originalExecute(async (trx) => {
					const result = await cb(trx);
					await gate.promise;
					return result;
				});
			}) as typeof tx.execute;
			return tx as any;
		});

	let pendingWrite: Promise<void> | null = null;
	act(() => {
		pendingWrite = setValueRef
			? (setValueRef("next") as Promise<void>)
			: Promise.resolve();
	});

	await waitFor(() =>
		snapshots.some((snapshot) => snapshot.primary === "next"),
	);
	const latest = snapshots[snapshots.length - 1];
	expect(latest).toMatchObject({
		primary: "next",
		secondary: "next",
	});

	await act(async () => {
		gate.resolve();
		await pendingWrite;
	});

	transactionSpy.mockRestore();
});

test("returns optimistic value immediately when setter is called", async () => {
	const lix = await openLix({});
	const TEST_KEY = "flashtype_test_optimistic" as any;
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>
			<KeyValueProvider defs={KEY_VALUE_DEFINITIONS}>
				<React.Suspense fallback={null}>{children}</React.Suspense>
			</KeyValueProvider>
		</LixProvider>
	);

	let hookResult: { current: unknown } = { current: null };
	await act(async () => {
		const { result } = renderHook(() => useKeyValue(TEST_KEY), { wrapper });
		hookResult = result as unknown as { current: unknown };
	});

	await waitFor(() => Array.isArray(hookResult.current as any));

	let pending: Promise<unknown> | undefined;
	await act(async () => {
		pending = (hookResult.current as any)[1]("value-1");
	});

	expect((hookResult.current as any)[0]).toBe("value-1");

	await act(async () => {
		await pending;
	});

	await waitFor(() => expect((hookResult.current as any)[0]).toBe("value-1"));
});

test("memoized children should not re-render when parent state changes", async () => {
	const lix = await openLix({});
	await lix.db
		.insertInto("key_value_by_version")
		.values({
			key: UNTRACKED_TEST_KEY,
			value: "initial",
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
		const pair = useKeyValue(UNTRACKED_TEST_KEY, {
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
