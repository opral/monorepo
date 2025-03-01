import { AsyncLocalStorage } from "async_hooks";
import { createRuntimeForTesting } from "./create-runtime.js";
import { test, expect } from "vitest";

test("tracks message calls", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de"],
	});

	const mockMessage = (str: string) => {
		runtime.trackMessageCall(str, "de");
	};

	runtime.overwriteServerAsyncLocalStorage(new AsyncLocalStorage());

	const [result, calls] = runtime.withMessageCallTracking(() => {
		mockMessage("test1");
		mockMessage("test2");
		return "test3";
	});

	expect(result).toBe("test3");
	expect(calls).toEqual(new Set(["test1:de", "test2:de"]));
});

test("message calls are properly scoped between different tracking contexts", async () => {
	const runtime = await createRuntimeForTesting({
		baseLocale: "en",
		locales: ["en", "de", "fr"],
	});

	const mockMessage = (str: string, locale: string) => {
		runtime.trackMessageCall(str, locale);
	};

	runtime.overwriteServerAsyncLocalStorage(new AsyncLocalStorage());

	// First tracking context
	const [result1, calls1] = runtime.withMessageCallTracking(() => {
		mockMessage("greeting", "de");
		mockMessage("farewell", "de");
		return "scope1";
	});

	// Second tracking context - should be isolated from the first
	const [result2, calls2] = runtime.withMessageCallTracking(() => {
		mockMessage("welcome", "fr");
		mockMessage("thanks", "fr");
		return "scope2";
	});

	// Third tracking context - nested calls
	const [result3, calls3] = runtime.withMessageCallTracking(() => {
		mockMessage("outer1", "de");

		// Nested tracking context
		const [nestedResult, nestedCalls] = runtime.withMessageCallTracking(() => {
			mockMessage("inner1", "fr");
			mockMessage("inner2", "fr");
			return "nested";
		});

		mockMessage("outer2", "de");

		// Verify nested context
		expect(nestedResult).toBe("nested");
		expect(nestedCalls).toEqual(new Set(["inner1:fr", "inner2:fr"]));

		return "scope3";
	});

	// Verify first context
	expect(result1).toBe("scope1");
	expect(calls1).toEqual(new Set(["greeting:de", "farewell:de"]));

	// Verify second context
	expect(result2).toBe("scope2");
	expect(calls2).toEqual(new Set(["welcome:fr", "thanks:fr"]));

	// Verify third context (outer calls only)
	expect(result3).toBe("scope3");
	expect(calls3).toEqual(new Set(["outer1:de", "outer2:de"]));

	// Verify contexts are isolated
	expect(calls1.has("welcome:fr")).toBe(false);
	expect(calls2.has("greeting:de")).toBe(false);
	expect(calls3.has("inner1:fr")).toBe(false);
});
