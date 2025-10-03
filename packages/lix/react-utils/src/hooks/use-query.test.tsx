import { test, expect, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import React, { Suspense } from "react";
import {
	useQuery,
	useQueryTakeFirst,
	useQueryTakeFirstOrThrow,
} from "./use-query.js";
import { LixProvider } from "../provider.js";
import { openLix, type LixKeyValue, type State, type Lix } from "@lix-js/sdk";

// React Error Boundaries require class components - no functional equivalent exists
class MockErrorBoundary extends React.Component<
	{ children: React.ReactNode; onError?: (error: Error) => void },
	{ hasError: boolean; error?: Error }
> {
	override state = { hasError: false, error: undefined };

	// @ts-expect-error - type error
	static override getDerivedStateFromError(error: Error) {
		return { hasError: true, error };
	}

	override componentDidCatch(error: Error) {
		this.props.onError?.(error);
	}

	override render() {
		return this.state.hasError ? (
			<div>Error occurred</div>
		) : (
			this.props.children
		);
	}
}

test("useQuery throws error when used outside LixProvider", () => {
	// We need to catch the error since it's thrown during render
	expect(() => {
		renderHook(() =>
			useQuery(({ lix }) => lix.db.selectFrom("key_value").selectAll()),
		);
	}).toThrow("useQuery must be used inside <LixProvider>.");
});

test("useSuspenseQuery returns array with data using new API", async () => {
	const lix = await openLix({});

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>
			<Suspense fallback={<div>Loading...</div>}>
				<MockErrorBoundary>{children}</MockErrorBoundary>
			</Suspense>
		</LixProvider>
	);

	let hookResult: { current: State<LixKeyValue>[] };

	await act(async () => {
		const { result } = renderHook(
			() => {
				const data = useQuery(({ lix }) =>
					lix.db
						.selectFrom("key_value")
						.selectAll()
						.where("key", "like", "test_%"),
				);
				return data;
			},
			{ wrapper },
		);
		hookResult = result;
	});

	// Wait for suspense to resolve and data to be available
	await waitFor(() => {
		expect(Array.isArray(hookResult.current)).toBe(true);
		expect(hookResult.current).toEqual([]); // No test keys initially
	});

	await lix.close();
});

test("useSuspenseQuery updates when data changes", async () => {
	const lix = await openLix({});
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>
			<Suspense fallback={<div>Loading...</div>}>
				<MockErrorBoundary>{children}</MockErrorBoundary>
			</Suspense>
		</LixProvider>
	);

	let hookResult: { current: State<LixKeyValue>[] };

	await act(async () => {
		const { result } = renderHook(
			() => {
				const data = useQuery(({ lix }) =>
					lix.db
						.selectFrom("key_value")
						.selectAll()
						.where("key", "like", "react_test_%"),
				);
				return data;
			},
			{ wrapper },
		);
		hookResult = result;
	});

	// Wait for initial empty data
	await waitFor(() => {
		expect(hookResult.current).toEqual([]);
	});

	// Insert a test key-value pair
	await act(async () => {
		await lix.db
			.insertInto("key_value")
			.values({ key: "react_test_key", value: "test_value" })
			.execute();
	});

	// Check updated data
	await waitFor(() => {
		expect(hookResult.current).toHaveLength(1);
		expect(hookResult.current[0]).toMatchObject({
			key: "react_test_key",
			value: "test_value",
		});
	});

	await lix.close();
});

test("useSuspenseQueryTakeFirst returns array with single item or undefined", async () => {
	const lix = await openLix({});

	// Insert test data
	await lix.db
		.insertInto("key_value")
		.values([
			{ key: "first_test_1", value: "first" },
			{ key: "first_test_2", value: "second" },
		])
		.execute();

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>
			<Suspense fallback={<div>Loading...</div>}>
				<MockErrorBoundary>{children}</MockErrorBoundary>
			</Suspense>
		</LixProvider>
	);

	let hookResult: { current: State<LixKeyValue> | undefined } | undefined;

	await act(async () => {
		const { result } = renderHook(
			() => {
				const data = useQueryTakeFirst(({ lix }) =>
					lix.db
						.selectFrom("key_value")
						.selectAll()
						.where("key", "like", "first_test_%")
						.orderBy("key", "asc"),
				);
				return data;
			},
			{ wrapper },
		);
		hookResult = result;
	});

	await waitFor(() => {
		expect(hookResult!.current).toMatchObject({
			key: "first_test_1",
			value: "first",
		});
	});

	await lix.close();
});

test("useSuspenseQueryTakeFirst returns undefined for empty results", async () => {
	const lix = await openLix({});
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>
			<Suspense fallback={<div>Loading...</div>}>
				<MockErrorBoundary>{children}</MockErrorBoundary>
			</Suspense>
		</LixProvider>
	);

	let hookResult: { current: State<LixKeyValue> | undefined };

	await act(async () => {
		const { result } = renderHook(
			() => {
				const data = useQueryTakeFirst(({ lix }) =>
					lix.db
						.selectFrom("key_value")
						.selectAll()
						.where("key", "=", "non_existent"),
				);
				return data;
			},
			{ wrapper },
		);
		hookResult = result;
	});

	await waitFor(() => {
		expect(hookResult.current).toBeUndefined();
	});

	await lix.close();
});

test("useQuery equalityFn can suppress updates", async () => {
	const lix = await openLix({});

	await lix.db
		.insertInto("key_value")
		.values({ key: "react_eq_key", value: "initial" })
		.execute();

	const equalitySpy = vi.fn(() => true);
	let renderCount = 0;

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>
			<Suspense fallback={<div>Loading...</div>}>
				<MockErrorBoundary>{children}</MockErrorBoundary>
			</Suspense>
		</LixProvider>
	);

	let hookResult!: { current: State<LixKeyValue>[] };

	await act(async () => {
		const { result } = renderHook(
			() => {
				const rows = useQuery(
					({ lix }) =>
						lix.db
							.selectFrom("key_value")
							.selectAll()
							.where("key", "=", "react_eq_key"),
					{ equalityFn: equalitySpy },
				);
				renderCount++;
				return rows;
			},
			{ wrapper },
		);
		hookResult = result;
	});

	await waitFor(() => {
		const rows = hookResult.current;
		expect(rows).toHaveLength(1);
		expect(rows?.[0]).toBeDefined();
		expect(rows?.[0]?.value).toBe("initial");
	});

	const rendersAfterInitial = renderCount;
	const equalityCallsAfterInitial = equalitySpy.mock.calls.length;

	await act(async () => {
		await lix.db
			.updateTable("key_value")
			.set({ value: "updated" })
			.where("key", "=", "react_eq_key")
			.execute();
	});

	await waitFor(() => {
		expect(equalitySpy.mock.calls.length).toBeGreaterThan(
			equalityCallsAfterInitial,
		);
	});

	// Because equalityFn always returns true, the hook should ignore the update.
	const rowsAfterUpdate = hookResult.current;
	expect(rowsAfterUpdate?.[0]).toBeDefined();
	expect(rowsAfterUpdate?.[0]?.value).toBe("initial");
	expect(renderCount).toBe(rendersAfterInitial);

	await lix.close();
});

test("useQuery cache key isolates by lix instance", async () => {
	const lix1 = await openLix({});
	const lix2 = await openLix({});

	const cacheKey = "cache_isolation_key";
	await lix1.db
		.insertInto("key_value")
		.values({ key: cacheKey, value: "one" })
		.execute();
	await lix2.db
		.insertInto("key_value")
		.values({ key: cacheKey, value: "two" })
		.execute();

	let currentLix: Lix = lix1;

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={currentLix}>
			<Suspense fallback={<div>Loading...</div>}>
				<MockErrorBoundary>{children}</MockErrorBoundary>
			</Suspense>
		</LixProvider>
	);

	let hookResult!: { current: State<LixKeyValue>[] };
	let rerender!: () => void;

	await act(async () => {
		const { result, rerender: rerenderFn } = renderHook(
			() =>
				useQuery(
					({ lix }) =>
						lix.db
							.selectFrom("key_value")
							.selectAll()
							.where("key", "=", cacheKey),
					{ subscribe: false },
				),
			{ wrapper },
		);
		hookResult = result;
		rerender = rerenderFn;
	});

	await waitFor(() => {
		const rows = hookResult.current;
		expect(rows).toHaveLength(1);
		expect(rows?.[0]?.value).toBe("one");
	});

	await act(async () => {
		currentLix = lix2;
		rerender();
	});

	await waitFor(() => {
		const rows = hookResult.current;
		expect(rows).toHaveLength(1);
		expect(rows?.[0]?.value).toBe("two");
	});

	await lix1.close();
	await lix2.close();
});

test("useQuery surfaces subscription errors via render", async () => {
	const lix = await openLix({});
	const error = new Error("subscription failed");
	// React logs caught errors to the console unless this flag is set.
	(error as any).suppressReactErrorLogging = true;
	const originalObserve = lix.observe.bind(lix);

	const observeSpy = vi.spyOn(lix, "observe").mockImplementation((builder) => {
		const observable = originalObserve(builder);
		return {
			subscribe: (observer: any) => {
				const subscription = observable.subscribe(observer);
				observer?.error?.(error);
				return subscription;
			},
		} as any;
	});

	const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

	const onError = vi.fn();

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>
			<Suspense fallback={<div>Loading...</div>}>
				<MockErrorBoundary onError={onError}>{children}</MockErrorBoundary>
			</Suspense>
		</LixProvider>
	);

	await act(async () => {
		renderHook(
			() =>
				useQuery(({ lix }) =>
					lix.db
						.selectFrom("key_value")
						.selectAll()
						.where("key", "=", "lix_id"),
				),
			{ wrapper },
		);
	});

	await waitFor(() => {
		expect(onError).toHaveBeenCalledTimes(1);
	});

	const [[caughtError]] = onError.mock.calls as [ [Error] ];
	expect(caughtError).toBe(error);

	observeSpy.mockRestore();
	consoleErrorSpy.mockRestore();
	await lix.close();
});

test("useSuspenseQueryTakeFirst updates reference when underlying row changes", async () => {
	const lix = await openLix({});
	const rowKey = "react_first_ref";

	await lix.db
		.insertInto("key_value")
		.values({ key: rowKey, value: "initial" })
		.execute();

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>
			<Suspense fallback={<div>Loading...</div>}>
				<MockErrorBoundary>{children}</MockErrorBoundary>
			</Suspense>
		</LixProvider>
	);

	let hookResult: { current: State<LixKeyValue> | undefined };

	await act(async () => {
		const { result } = renderHook(
			() =>
				useQueryTakeFirst(({ lix }) =>
					lix.db.selectFrom("key_value").selectAll().where("key", "=", rowKey),
				),
			{ wrapper },
		);
		hookResult = result;
	});

	await waitFor(() => {
		expect(hookResult!.current?.value).toBe("initial");
	});

	const initialRef = hookResult!.current;

	await act(async () => {
		await lix.db
			.updateTable("key_value")
			.set({ value: "updated" })
			.where("key", "=", rowKey)
			.execute();
	});

	await waitFor(() => {
		expect(hookResult!.current?.value).toBe("updated");
		expect(hookResult!.current).not.toBe(initialRef);
	});

	await lix.close();
});

test("useSuspenseQueryTakeFirst re-emits when aggregate result returns to the initial value", async () => {
	const lix = await openLix({});
	const key = "agg_count_test";

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>
			<Suspense fallback={<div>Loading...</div>}>
				<MockErrorBoundary>{children}</MockErrorBoundary>
			</Suspense>
		</LixProvider>
	);

	let hookResult: { current: { count: number | null } | undefined } | undefined;

	await act(async () => {
		const { result } = renderHook(
			() =>
				useQueryTakeFirst(({ lix }) =>
					lix.db
						.selectFrom("key_value")
						.select((eb) => [eb.fn.count<number>("value").as("count")])
						.where("key", "=", key),
				),
			{ wrapper },
		);
		hookResult = result;
	});

	await waitFor(() => {
		expect(hookResult!.current?.count ?? 0).toBe(0);
	});

	await act(async () => {
		await lix.db.insertInto("key_value").values({ key, value: "v1" }).execute();
	});

	await waitFor(() => {
		expect(hookResult!.current?.count ?? 0).toBe(1);
	});

	await act(async () => {
		await lix.db.deleteFrom("key_value").where("key", "=", key).execute();
	});

	await waitFor(() => {
		expect(hookResult!.current?.count ?? -1).toBe(0);
	});

	await lix.close();
});

test("useSuspenseQuery return type is properly typed", async () => {
	const lix = await openLix({});
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>
			<Suspense fallback={<div>Loading...</div>}>
				<MockErrorBoundary>{children}</MockErrorBoundary>
			</Suspense>
		</LixProvider>
	);

	let hookResult: { current: State<LixKeyValue>[] } | undefined;

	await act(async () => {
		const { result } = renderHook(
			() => {
				const data = useQuery(({ lix }) =>
					lix.db.selectFrom("key_value").selectAll(),
				);
				return data;
			},
			{ wrapper },
		);
		hookResult = result;
	});

	// Wait for data to be available
	await waitFor(() => {
		expect(hookResult).toBeDefined();
		expect(Array.isArray(hookResult!.current)).toBe(true);
	});

	// Type test: data should be properly typed as an array of KeyValue
	// This should pass without any type errors if the types are working correctly
	hookResult!.current satisfies State<LixKeyValue>[];

	await lix.close();
});

test("useSuspenseQuery error handling with ErrorBoundary", async () => {
	const lix = await openLix({});
	let caught: Error | undefined;

	// Suppress console errors for this test
	const originalError = console.error;
	console.error = () => {};

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>
			<Suspense fallback={<div>Loading…</div>}>
				<MockErrorBoundary onError={(e) => (caught = e)}>
					{children}
				</MockErrorBoundary>
			</Suspense>
		</LixProvider>
	);

	await act(async () => {
		renderHook(
			() =>
				useQuery(({ lix }) =>
					// invalid table: will reject then throw
					lix.db.selectFrom("non_existent_table" as never).selectAll(),
				),
			{ wrapper },
		);
	});

	await waitFor(() => {
		expect(caught).toBeDefined();
	});

	expect(caught!.message).toMatch(/no such table/i);

	// Restore console.error
	console.error = originalError;
	await lix.close();
});

test("useSuspenseQueryTakeFirstOrThrow returns data when result exists", async () => {
	const lix = await openLix({});

	// Insert test data
	await lix.db
		.insertInto("key_value")
		.values({ key: "throw_test", value: "exists" })
		.execute();

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>
			<Suspense fallback={<div>Loading...</div>}>
				<MockErrorBoundary>{children}</MockErrorBoundary>
			</Suspense>
		</LixProvider>
	);

	let hookResult: { current: State<LixKeyValue> };

	await act(async () => {
		const { result } = renderHook(
			() => {
				const data = useQueryTakeFirstOrThrow(({ lix }) =>
					lix.db
						.selectFrom("key_value")
						.selectAll()
						.where("key", "=", "throw_test"),
				);
				return data;
			},
			{ wrapper },
		);
		hookResult = result;
	});

	await waitFor(() => {
		expect(hookResult.current).toMatchObject({
			key: "throw_test",
			value: "exists",
		});
	});

	await lix.close();
});

test("useSuspenseQueryTakeFirstOrThrow throws when no result found", async () => {
	const lix = await openLix({});
	let caught: Error | undefined;

	// Suppress console errors for this test
	const originalError = console.error;
	console.error = () => {};

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>
			<Suspense fallback={<div>Loading...</div>}>
				<MockErrorBoundary onError={(e) => (caught = e)}>
					{children}
				</MockErrorBoundary>
			</Suspense>
		</LixProvider>
	);

	await act(async () => {
		renderHook(
			() => {
				const data = useQueryTakeFirstOrThrow(({ lix }) =>
					lix.db
						.selectFrom("key_value")
						.selectAll()
						.where("key", "=", "does_not_exist"),
				);
				return data;
			},
			{ wrapper },
		);
	});

	await waitFor(() => {
		expect(caught).toBeDefined();
		expect(caught!.message).toBe("No result found");
	});

	// Restore console.error
	console.error = originalError;
	await lix.close();
});

test("useSuspenseQuery re-executes when query function changes (dependency array fix)", async () => {
	const lix = await openLix({});

	// Insert test data with different prefixes
	await lix.db
		.insertInto("key_value")
		.values([
			{ key: "prefix_a_1", value: "value_a_1" },
			{ key: "prefix_a_2", value: "value_a_2" },
			{ key: "prefix_b_1", value: "value_b_1" },
			{ key: "prefix_b_2", value: "value_b_2" },
		])
		.execute();

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>
			<Suspense fallback={<div>Loading...</div>}>
				<MockErrorBoundary>{children}</MockErrorBoundary>
			</Suspense>
		</LixProvider>
	);

	// State to control which prefix to query
	let hookResult: { current: State<LixKeyValue>[] };
	let rerender: (props?: { prefix: string }) => void;

	await act(async () => {
		const { result, rerender: rerenderFn } = renderHook(
			({ prefix = "prefix_a" }: { prefix?: string } = {}) => {
				// Create a new query function each time prefix changes
				const data = useQuery(({ lix }) =>
					lix.db
						.selectFrom("key_value")
						.selectAll()
						.where("key", "like", `${prefix}_%`)
						.orderBy("key", "asc"),
				);
				return data;
			},
			{
				wrapper,
				initialProps: { prefix: "prefix_a" },
			},
		);
		hookResult = result;
		rerender = rerenderFn;
	});

	// Wait for initial data (prefix_a results)
	await waitFor(() => {
		expect(hookResult.current).toHaveLength(2);
		expect(hookResult.current[0]).toMatchObject({
			key: "prefix_a_1",
			value: "value_a_1",
		});
		expect(hookResult.current[1]).toMatchObject({
			key: "prefix_a_2",
			value: "value_a_2",
		});
	});

	// Change the query prefix - this should trigger a re-execution
	await act(async () => {
		rerender({ prefix: "prefix_b" });
	});

	// Wait for the query to re-execute with new prefix
	await waitFor(() => {
		expect(hookResult.current).toHaveLength(2);
		expect(hookResult.current[0]).toMatchObject({
			key: "prefix_b_1",
			value: "value_b_1",
		});
		expect(hookResult.current[1]).toMatchObject({
			key: "prefix_b_2",
			value: "value_b_2",
		});
	});

	await lix.close();
});

test("useQuery with subscribe: false executes once without live updates", async () => {
	const lix = await openLix({});

	// Insert initial test data
	await lix.db
		.insertInto("key_value")
		.values({ key: "once_test", value: "initial" })
		.execute();

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>
			<Suspense fallback={<div>Loading...</div>}>
				<MockErrorBoundary>{children}</MockErrorBoundary>
			</Suspense>
		</LixProvider>
	);

	let hookResult: { current: State<LixKeyValue>[] };

	await act(async () => {
		const { result } = renderHook(
			() => {
				const data = useQuery(
					({ lix }) =>
						lix.db
							.selectFrom("key_value")
							.selectAll()
							.where("key", "=", "once_test"),
					{ subscribe: false },
				);
				return data;
			},
			{ wrapper },
		);
		hookResult = result;
	});

	// Wait for initial data
	await waitFor(() => {
		expect(hookResult.current).toHaveLength(1);
		expect(hookResult.current[0]).toMatchObject({
			key: "once_test",
			value: "initial",
		});
	});

	// Update the data in the database
	await act(async () => {
		await lix.db
			.updateTable("key_value")
			.set({ value: "updated" })
			.where("key", "=", "once_test")
			.execute();
	});

	// Give some time for potential updates (there shouldn't be any)
	await new Promise((resolve) => setTimeout(resolve, 100));

	// Data should NOT have updated because subscribe: false
	expect(hookResult!.current).toHaveLength(1);
	expect(hookResult!.current[0]).toMatchObject({
		key: "once_test",
		value: "initial", // Still the initial value
	});

	await lix.close();
});

test("useQuery subscription updates when query dependencies change", async () => {
	const lix = await openLix({});

	// Insert initial test data
	await lix.db
		.insertInto("key_value")
		.values([
			{ key: "sub_test_a_1", value: "initial_a" },
			{ key: "sub_test_b_1", value: "initial_b" },
		])
		.execute();

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>
			<Suspense fallback={<div>Loading...</div>}>
				<MockErrorBoundary>{children}</MockErrorBoundary>
			</Suspense>
		</LixProvider>
	);

	let hookResult: { current: State<LixKeyValue>[] };
	let rerender: (props?: { filter: string }) => void;

	await act(async () => {
		const { result, rerender: rerenderFn } = renderHook(
			({ filter = "sub_test_a" }: { filter?: string } = {}) => {
				const data = useQuery(({ lix }) =>
					lix.db
						.selectFrom("key_value")
						.selectAll()
						.where("key", "like", `${filter}_%`),
				);
				return data;
			},
			{
				wrapper,
				initialProps: { filter: "sub_test_a" },
			},
		);
		hookResult = result;
		rerender = rerenderFn;
	});

	// Verify initial subscription works
	await waitFor(() => {
		expect(hookResult.current).toHaveLength(1);
		expect(hookResult.current[0]?.key).toBe("sub_test_a_1");
	});

	// Switch to different filter - new subscription should be created
	await act(async () => {
		rerender({ filter: "sub_test_b" });
	});

	// Verify new subscription works
	await waitFor(() => {
		expect(hookResult.current).toHaveLength(1);
		expect(hookResult.current[0]?.key).toBe("sub_test_b_1");
	});

	// Insert new data that matches the current filter
	await act(async () => {
		await lix.db
			.insertInto("key_value")
			.values({ key: "sub_test_b_2", value: "new_b" })
			.execute();
	});

	// The subscription should pick up the new data
	await waitFor(() => {
		expect(hookResult.current).toHaveLength(2);
		expect(hookResult.current.some((item) => item.key === "sub_test_b_2")).toBe(
			true,
		);
	});

	await lix.close();
});

test("useQuery refreshes when lix instance is switched", async () => {
	// Create two separate lix instances - each will have its own unique lix_id
	const lix1 = await openLix({});
	const lix2 = await openLix({});

	// Check that they have different lix_id values
	const lix1IdDirect = await lix1.db
		.selectFrom("key_value")
		.selectAll()
		.where("key", "=", "lix_id")
		.executeTakeFirst();
	const lix2IdDirect = await lix2.db
		.selectFrom("key_value")
		.selectAll()
		.where("key", "=", "lix_id")
		.executeTakeFirst();

	// Ensure the test is valid - the two instances should have different lix_ids
	expect(lix1IdDirect?.value).not.toBe(lix2IdDirect?.value);

	// Use a state variable to control which lix instance is used
	let currentLix = lix1;

	// Wrapper function that uses the current lix
	const TestComponent = () => {
		const data = useQuery(({ lix }) =>
			lix.db.selectFrom("key_value").selectAll().where("key", "=", "lix_id"),
		);
		return data;
	};

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={currentLix}>
			<Suspense fallback={<div>Loading...</div>}>
				<MockErrorBoundary>{children}</MockErrorBoundary>
			</Suspense>
		</LixProvider>
	);

	let hookResult: { current: State<LixKeyValue>[] };
	let rerender: () => void;

	await act(async () => {
		const { result, rerender: rerenderFn } = renderHook(() => TestComponent(), {
			wrapper,
		});
		hookResult = result;
		rerender = rerenderFn;
	});

	// Verify we get data from lix1
	await waitFor(() => {
		expect(hookResult.current).toHaveLength(1);
		expect(hookResult.current[0]?.key).toBe("lix_id");
	});

	// Store the initial lix_id value
	const lix1Id = hookResult!.current[0]?.value;

	// Switch to lix2 by changing the current lix and rerendering
	await act(async () => {
		currentLix = lix2;
		rerender();
	});

	// Verify the query refreshes and we now get data from lix2
	await waitFor(() => {
		expect(hookResult.current).toHaveLength(1);
		expect(hookResult.current[0]?.key).toBe("lix_id");
		// The lix_id value should be different from lix1
		expect(hookResult.current[0]?.value).not.toBe(lix1Id);
	});

	await lix1.close();
	await lix2.close();
});
