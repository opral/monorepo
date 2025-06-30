import { test, expect, vi } from "vitest";
import { LixObservable } from "./lix-observable.js";

test("should deliver values to observer", () => {
	const values: number[][] = [];
	const observable = new LixObservable<number>((observer) => {
		observer.next?.([1, 2, 3]);
		observer.next?.([4, 5, 6]);
	});

	observable.subscribe({
		next: (value) => values.push(value),
	});

	expect(values).toEqual([
		[1, 2, 3],
		[4, 5, 6],
	]);
});

test("should call error handler", () => {
	const error = new Error("Test error");
	const errorHandler = vi.fn();

	const observable = new LixObservable<number>((observer) => {
		observer.error?.(error);
	});

	observable.subscribe({
		error: errorHandler,
	});

	expect(errorHandler).toHaveBeenCalledWith(error);
});

test("should call complete handler", () => {
	const completeHandler = vi.fn();

	const observable = new LixObservable<number>((observer) => {
		observer.complete?.();
	});

	observable.subscribe({
		complete: completeHandler,
	});

	expect(completeHandler).toHaveBeenCalled();
});

test("should stop delivering values after unsubscribe", () => {
	const values: number[][] = [];
	let observerRef: any;

	const observable = new LixObservable<number>((observer) => {
		observerRef = observer;
		observer.next?.([1]);
		return () => {
			// cleanup
		};
	});

	const subscription = observable.subscribe({
		next: (value) => values.push(value),
	});

	expect(values).toEqual([[1]]);

	subscription.unsubscribe();
	observerRef.next?.([2]); // Should not be delivered

	expect(values).toEqual([[1]]);
});

test("should not deliver values after error", () => {
	const values: number[][] = [];
	const errors: any[] = [];
	let observerRef: any;

	const observable = new LixObservable<number>((observer) => {
		observerRef = observer;
	});

	observable.subscribe({
		next: (value) => values.push(value),
		error: (err) => errors.push(err),
	});

	observerRef.next?.([1]);
	observerRef.error?.(new Error("Test"));
	observerRef.next?.([2]); // Should not be delivered

	expect(values).toEqual([[1]]);
	expect(errors).toHaveLength(1);
});

test("should not deliver values after complete", () => {
	const values: number[][] = [];
	let observerRef: any;

	const observable = new LixObservable<number>((observer) => {
		observerRef = observer;
	});

	observable.subscribe({
		next: (value) => values.push(value),
	});

	observerRef.next?.([1]);
	observerRef.complete?.();
	observerRef.next?.([2]); // Should not be delivered

	expect(values).toEqual([[1]]);
});

test("should call cleanup function on unsubscribe", () => {
	const cleanup = vi.fn();

	const observable = new LixObservable<number>(() => {
		return cleanup;
	});

	const subscription = observable.subscribe({});
	expect(cleanup).not.toHaveBeenCalled();

	subscription.unsubscribe();
	expect(cleanup).toHaveBeenCalledOnce();
});

test("should not call cleanup multiple times", () => {
	const cleanup = vi.fn();

	const observable = new LixObservable<number>(() => {
		return cleanup;
	});

	const subscription = observable.subscribe({});
	subscription.unsubscribe();
	subscription.unsubscribe(); // Second call

	expect(cleanup).toHaveBeenCalledOnce();
});

test("should implement Symbol.observable", () => {
	const observable = new LixObservable<number>(() => {});
	expect(observable[Symbol.observable]()).toBe(observable);
});

test("subscribeTakeFirst should return first element", () => {
	const values: (number | undefined)[] = [];

	const observable = new LixObservable<number>((observer) => {
		observer.next?.([1, 2, 3]);
		observer.next?.([4, 5, 6]);
	});

	observable.subscribeTakeFirst({
		next: (value) => values.push(value),
	});

	expect(values).toEqual([1, 4]);
});

test("subscribeTakeFirst should return undefined for empty array", () => {
	const values: (number | undefined)[] = [];

	const observable = new LixObservable<number>((observer) => {
		observer.next?.([]);
	});

	observable.subscribeTakeFirst({
		next: (value) => values.push(value),
	});

	expect(values).toEqual([undefined]);
});

test("subscribeTakeFirstOrThrow should return first element", () => {
	const values: number[] = [];

	const observable = new LixObservable<number>((observer) => {
		observer.next?.([1, 2, 3]);
	});

	observable.subscribeTakeFirstOrThrow({
		next: (value) => values.push(value),
	});

	expect(values).toEqual([1]);
});

test("subscribeTakeFirstOrThrow should error on empty array", () => {
	const errors: any[] = [];

	const observable = new LixObservable<number>((observer) => {
		observer.next?.([]);
	});

	observable.subscribeTakeFirstOrThrow({
		error: (err) => errors.push(err),
	});

	expect(errors).toHaveLength(1);
	expect(errors[0]).toBeInstanceOf(Error);
	expect(errors[0].message).toBe("Query returned no rows");
});

test("subscribeTakeFirstOrThrow should pass through original errors", () => {
	const originalError = new Error("Original error");
	const errors: any[] = [];

	const observable = new LixObservable<number>((observer) => {
		observer.error?.(originalError);
	});

	observable.subscribeTakeFirstOrThrow({
		error: (err) => errors.push(err),
	});

	expect(errors).toEqual([originalError]);
});

test("should handle observer without handlers gracefully", () => {
	const observable = new LixObservable<number>((observer) => {
		observer.next?.([1]);
		observer.error?.(new Error("Test"));
		observer.complete?.();
	});

	// Should not throw
	expect(() => {
		observable.subscribe({});
	}).not.toThrow();
});

test("should support RxJS interop pattern", () => {
	const observable = new LixObservable<number>(() => {});

	// Simulate RxJS from() behavior
	const rxjsCompatible = observable[Symbol.observable]();
	expect(rxjsCompatible).toBe(observable);

	// Should be able to subscribe to the returned value
	const values: number[][] = [];
	rxjsCompatible.subscribe({
		next: (value) => values.push(value),
	});
});
