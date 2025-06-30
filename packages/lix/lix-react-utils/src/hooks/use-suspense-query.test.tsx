import { test, expect } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import React, { Suspense } from "react";
import {
	useSuspenseQuery,
	useSuspenseQueryTakeFirst,
	useSuspenseQueryTakeFirstOrThrow,
} from "./use-suspense-query.js";
import { LixProvider } from "../provider.js";
import { openLix, type KeyValue, type State } from "@lix-js/sdk";

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

test("useSuspenseQuery throws error when used outside LixProvider", () => {
	// We need to catch the error since it's thrown during render
	expect(() => {
		renderHook(() =>
			useSuspenseQuery((lix) => lix.db.selectFrom("key_value").selectAll()),
		);
	}).toThrow("useSuspenseQuery must be used inside <LixProvider>.");
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

	let hookResult: { current: State<KeyValue>[] };

	await act(async () => {
		const { result } = renderHook(
			() => {
				const data = useSuspenseQuery((lix) =>
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

	let hookResult: { current: State<KeyValue>[] };

	await act(async () => {
		const { result } = renderHook(
			() => {
				const data = useSuspenseQuery((lix) =>
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

	let hookResult: { current: State<KeyValue> | undefined };

	await act(async () => {
		const { result } = renderHook(
			() => {
				const data = useSuspenseQueryTakeFirst((lix) =>
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
		expect(hookResult.current).toMatchObject({
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

	let hookResult: { current: State<KeyValue> | undefined };

	await act(async () => {
		const { result } = renderHook(
			() => {
				const data = useSuspenseQueryTakeFirst((lix) =>
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

test("useSuspenseQuery return type is properly typed", async () => {
	const lix = await openLix({});
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>
			<Suspense fallback={<div>Loading...</div>}>
				<MockErrorBoundary>{children}</MockErrorBoundary>
			</Suspense>
		</LixProvider>
	);

	let hookResult: { current: State<KeyValue>[] } | undefined;

	await act(async () => {
		const { result } = renderHook(
			() => {
				const data = useSuspenseQuery((lix) =>
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
	hookResult!.current satisfies State<KeyValue>[];

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
				useSuspenseQuery((lix) =>
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

	let hookResult: { current: State<KeyValue> };

	await act(async () => {
		const { result } = renderHook(
			() => {
				const data = useSuspenseQueryTakeFirstOrThrow((lix) =>
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
				const data = useSuspenseQueryTakeFirstOrThrow((lix) =>
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
