import { test, expect } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { useQuery, useQueryTakeFirst } from "./use-query.js";
import { LixProvider } from "../provider.js";
import { openLix, type KeyValue, type State } from "@lix-js/sdk";

async function waitForUpdate<T>(
	result: { readonly current: T },
	selector: (v: T) => unknown,
) {
	const start = selector(result.current);
	await new Promise<void>((resolve) => {
		const id = setInterval(() => {
			if (selector(result.current) !== start) {
				clearInterval(id);
				resolve();
			}
		}, 1); // 1 ms polling – negligible in tests
	});
}

test("useQuery throws error when used outside LixProvider", () => {
	// We need to catch the error since it's thrown during render
	expect(() => {
		renderHook(() =>
			useQuery((lix) => lix.db.selectFrom("key_value").selectAll()),
		);
	}).toThrow("useQuery must be used inside <LixProvider>.");
});

test("useQuery returns loading state initially", async () => {
	const lix = await openLix({});
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>{children}</LixProvider>
	);

	const { result } = renderHook(
		() =>
			useQuery((lix) =>
				lix.db
					.selectFrom("key_value")
					.selectAll()
					.where("key", "like", "test_%"),
			),
		{ wrapper },
	);

	expect(result.current.loading).toBe(true);
	expect(result.current.data).toBeUndefined();
	expect(result.current.error).toBe(null);

	await lix.close();
});

test("useQuery returns data after initial load", async () => {
	const lix = await openLix({});
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>{children}</LixProvider>
	);

	const { result } = renderHook(
		() =>
			useQuery((lix) =>
				lix.db
					.selectFrom("key_value")
					.selectAll()
					.where("key", "like", "test_%"),
			),
		{ wrapper },
	);

	// Wait for loading to become false
	await waitForUpdate(result, (r) => r.loading);

	expect(result.current.loading).toBe(false);
	expect(result.current.data).toEqual([]); // No test keys initially
	expect(result.current.error).toBe(null);

	await lix.close();
});

test("useQuery updates when data changes", async () => {
	const lix = await openLix({});
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>{children}</LixProvider>
	);

	const { result } = renderHook(
		() =>
			useQuery((lix) =>
				lix.db
					.selectFrom("key_value")
					.selectAll()
					.where("key", "like", "react_test_%"),
			),
		{ wrapper },
	);

	// Wait for initial empty data
	await waitFor(() => {
		expect(result.current.loading).toBe(false);
		expect(result.current.data).toEqual([]);
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
		expect(result.current.data).toHaveLength(1);
		expect(result.current.data?.[0]).toMatchObject({
			key: "react_test_key",
			value: "test_value",
		});
	});

	await lix.close();
});

test("useQuery handles query errors", async () => {
	const lix = await openLix({});
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>{children}</LixProvider>
	);

	const { result } = renderHook(
		() =>
			useQuery((lix) =>
				lix.db.selectFrom("non_existent_table" as never).selectAll(),
			),
		{ wrapper },
	);

	await waitFor(() => {
		expect(result.current.loading).toBe(false);
	});

	expect(result.current.error).toBeInstanceOf(Error);
	expect(result.current.data).toBeUndefined();

	await lix.close();
});

test("useQuery multiple subscriptions work independently", async () => {
	const lix = await openLix({});
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>{children}</LixProvider>
	);

	const { result: result1 } = renderHook(
		() =>
			useQuery((lix) =>
				lix.db
					.selectFrom("key_value")
					.selectAll()
					.where("key", "like", "multi_1_%"),
			),
		{ wrapper },
	);

	const { result: result2 } = renderHook(
		() =>
			useQuery((lix) =>
				lix.db
					.selectFrom("key_value")
					.selectAll()
					.where("key", "like", "multi_2_%"),
			),
		{ wrapper },
	);

	// Wait for both to load
	await waitFor(() => {
		expect(result1.current.loading).toBe(false);
		expect(result2.current.loading).toBe(false);
	});

	// Insert data for first query
	await act(async () => {
		await lix.db
			.insertInto("key_value")
			.values({ key: "multi_1_key", value: "value_1" })
			.execute();
	});

	// Only first query should update
	await waitFor(() => {
		expect(result1.current.data).toHaveLength(1);
	});
	expect(result2.current.data).toHaveLength(0);

	// Insert data for second query
	await act(async () => {
		await lix.db
			.insertInto("key_value")
			.values({ key: "multi_2_key", value: "value_2" })
			.execute();
	});

	// Now second query should update
	await waitFor(() => {
		expect(result2.current.data).toHaveLength(1);
	});

	await lix.close();
});

test("useQueryTakeFirst returns first item from array", async () => {
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
		<LixProvider lix={lix}>{children}</LixProvider>
	);

	const { result } = renderHook(
		() =>
			useQueryTakeFirst((lix) =>
				lix.db
					.selectFrom("key_value")
					.selectAll()
					.where("key", "like", "first_test_%")
					.orderBy("key", "asc"),
			),
		{ wrapper },
	);

	await waitFor(() => {
		expect(result.current.loading).toBe(false);
	});

	expect(result.current.data).toMatchObject({
		key: "first_test_1",
		value: "first",
	});

	await lix.close();
});

test("useQueryTakeFirst returns undefined for empty results", async () => {
	const lix = await openLix({});
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>{children}</LixProvider>
	);

	const { result } = renderHook(
		() =>
			useQueryTakeFirst((lix) =>
				lix.db
					.selectFrom("key_value")
					.selectAll()
					.where("key", "=", "non_existent"),
			),
		{ wrapper },
	);

	await waitFor(() => {
		expect(result.current.loading).toBe(false);
	});

	expect(result.current.data).toBeUndefined();

	await lix.close();
});

test("useQuery vs useQueryTakeFirst loading behavior with empty results", async () => {
	const lix = await openLix({});
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>{children}</LixProvider>
	);

	// Test useQuery with empty results - should return [] and loading=false
	const { result: queryResult } = renderHook(
		() =>
			useQuery((lix) =>
				lix.db
					.selectFrom("key_value")
					.selectAll()
					.where("key", "=", "empty_test_query"),
			),
		{ wrapper },
	);

	// Test useQueryTakeFirst with empty results - should return undefined and loading=false
	const { result: takeFirstResult } = renderHook(
		() =>
			useQueryTakeFirst((lix) =>
				lix.db
					.selectFrom("key_value")
					.selectAll()
					.where("key", "=", "empty_test_takefirst"),
			),
		{ wrapper },
	);

	// Wait for both to complete
	await waitFor(() => {
		expect(queryResult.current.loading).toBe(false);
	});

	await waitFor(() => {
		expect(takeFirstResult.current.loading).toBe(false);
	});

	// Verify useQuery returns empty array
	expect(queryResult.current.data).toEqual([]);
	expect(queryResult.current.error).toBe(null);
	expect(queryResult.current.loading).toBe(false);

	// Verify useQueryTakeFirst returns undefined
	expect(takeFirstResult.current.data).toBeUndefined();
	expect(takeFirstResult.current.error).toBe(null);
	expect(takeFirstResult.current.loading).toBe(false);

	await lix.close();
});

test("useQuery return type is properly typed", async () => {
	const lix = await openLix({});
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>{children}</LixProvider>
	);

	const { result } = renderHook(
		() => useQuery((lix) => lix.db.selectFrom("key_value").selectAll()),
		{ wrapper },
	);

	// Type test: data should be properly typed as an array of {key: string, value: string}
	// This should pass without any type errors if the types are working correctly
	result.current.data satisfies State<KeyValue>[] | undefined;

	// Wait for loading to complete
	await waitForUpdate(result, (r) => r.loading);

	expect(result.current.loading).toBe(false);
	expect(result.current.error).toBe(null);
	expect(Array.isArray(result.current.data)).toBe(true);

	await lix.close();
});
