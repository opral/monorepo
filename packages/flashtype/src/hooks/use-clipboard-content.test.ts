import { renderHook, act } from "@testing-library/react";
import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";
import { useClipboardContent } from "./use-clipboard-content";

describe("useClipboardContent", () => {
	const mockReadText = vi.fn();

	beforeEach(() => {
		vi.useFakeTimers();
		Object.defineProperty(navigator, "clipboard", {
			value: { readText: mockReadText },
			writable: true,
			configurable: true,
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	test("returns false initially when clipboard is empty", async () => {
		mockReadText.mockResolvedValue("");

		const { result } = renderHook(() => useClipboardContent());

		// Initial state is false
		expect(result.current).toBe(false);

		// Flush promises to let the initial check complete
		await act(async () => {
			await Promise.resolve();
		});

		expect(result.current).toBe(false);
	});

	test("returns true when clipboard has content", async () => {
		mockReadText.mockResolvedValue("some text content");

		const { result } = renderHook(() => useClipboardContent());

		// Flush promises to let the initial check complete
		await act(async () => {
			await Promise.resolve();
		});

		expect(result.current).toBe(true);
	});

	test("returns false when clipboard has only whitespace", async () => {
		mockReadText.mockResolvedValue("   \n\t  ");

		const { result } = renderHook(() => useClipboardContent());

		await act(async () => {
			await Promise.resolve();
		});

		expect(result.current).toBe(false);
	});

	test("returns false when clipboard.readText throws (permission denied)", async () => {
		mockReadText.mockRejectedValue(new Error("Permission denied"));

		const { result } = renderHook(() => useClipboardContent());

		await act(async () => {
			await Promise.resolve();
		});

		expect(result.current).toBe(false);
	});

	test("updates state when polling detects clipboard change", async () => {
		mockReadText.mockResolvedValue("");

		const { result } = renderHook(() => useClipboardContent());

		// Flush initial check
		await act(async () => {
			await Promise.resolve();
		});

		expect(result.current).toBe(false);

		// Change clipboard content
		mockReadText.mockResolvedValue("new content");

		// Advance timer by 2 seconds (polling interval) and flush
		await act(async () => {
			vi.advanceTimersByTime(2000);
			await Promise.resolve();
		});

		expect(result.current).toBe(true);
	});

	test("cleans up event listeners and interval on unmount", async () => {
		const addEventListenerSpy = vi.spyOn(window, "addEventListener");
		const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
		const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");

		mockReadText.mockResolvedValue("");

		const { unmount } = renderHook(() => useClipboardContent());

		await act(async () => {
			await Promise.resolve();
		});

		expect(addEventListenerSpy).toHaveBeenCalledWith(
			"focus",
			expect.any(Function),
		);

		unmount();

		expect(removeEventListenerSpy).toHaveBeenCalledWith(
			"focus",
			expect.any(Function),
		);
		expect(clearIntervalSpy).toHaveBeenCalled();

		addEventListenerSpy.mockRestore();
		removeEventListenerSpy.mockRestore();
		clearIntervalSpy.mockRestore();
	});
});
