import { test, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import { useLix } from "./use-lix.js";
import { LixProvider } from "../provider.js";
import { openLix } from "@lix-js/sdk";

test("useLix throws error when used outside LixProvider", () => {
	expect(() => {
		renderHook(() => useLix());
	}).toThrow("useLix must be used inside <LixProvider>.");
});

test("useLix returns the Lix instance when used inside LixProvider", async () => {
	const lix = await openLix({});
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<LixProvider lix={lix}>{children}</LixProvider>
	);

	const { result } = renderHook(() => useLix(), { wrapper });

	expect(result.current).toBe(lix);
	expect(result.current.db).toBeDefined();
	expect(result.current.observe).toBeDefined();
	expect(result.current.hooks).toBeDefined();

	await lix.close();
});
