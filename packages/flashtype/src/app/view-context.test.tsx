import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { useViewContext } from "./view-context";
import type { PanelState, ViewContext } from "./types";
import type { Lix } from "@lix-js/sdk";

const mockLix = {} as Lix;

const createParentContext = (
	partial: Partial<ViewContext> = {},
): ViewContext => ({
	lix: mockLix,
	isPanelFocused: false,
	setTabBadgeCount: () => {},
	...partial,
});

describe("useViewContext", () => {
	test("tracks badge counts via setTabBadgeCount", () => {
		const panel: PanelState = {
			views: [{ instance: "alpha", kind: "custom" }],
			activeInstance: "alpha",
		};

		const parent = createParentContext({ isPanelFocused: true });
		const { result, rerender } = renderHook(useViewContext, {
			initialProps: { panel, isFocused: true, parentContext: parent },
		});

		expect(result.current.badgeCounts).toEqual({});

		const context = result.current.makeContext(panel.views[0]!);
		expect(context.isPanelFocused).toBe(true);

		act(() => {
			context.setTabBadgeCount(3);
		});
		expect(result.current.badgeCounts).toEqual({ alpha: 3 });

		act(() => {
			context.setTabBadgeCount(null);
		});
		expect(result.current.badgeCounts).toEqual({});

		rerender({
			panel: { views: [], activeInstance: null },
			isFocused: true,
			parentContext: parent,
		});
		expect(result.current.badgeCounts).toEqual({});
	});

	test("derives base context from parent", () => {
		const parent: ViewContext = createParentContext({
			isPanelFocused: false,
		});
		const panel: PanelState = {
			views: [{ instance: "beta", kind: "custom" }],
			activeInstance: "beta",
		};

		const { result } = renderHook(useViewContext, {
			initialProps: { panel, isFocused: true, parentContext: parent },
		});

		const context = result.current.makeContext(panel.views[0]!);
		expect(context.isPanelFocused).toBe(true);
		act(() => {
			context.setTabBadgeCount(5);
		});
		expect(result.current.badgeCounts.beta).toBe(5);
	});

	test("marks only the active view as active", () => {
		const parent = createParentContext();
		const panel: PanelState = {
			views: [
				{ instance: "alpha", kind: "custom" },
				{ instance: "beta", kind: "custom" },
			],
			activeInstance: "alpha",
		};

		const { result, rerender } = renderHook(useViewContext, {
			initialProps: { panel, isFocused: true, parentContext: parent },
		});

		const alphaCtx = result.current.makeContext(panel.views[0]!);
		const betaCtx = result.current.makeContext(panel.views[1]!);
		expect(alphaCtx.isActiveView).toBe(true);
		expect(betaCtx.isActiveView).toBe(false);

		rerender({
			panel: { ...panel, activeInstance: "beta" },
			isFocused: true,
			parentContext: parent,
		});

		const alphaAfter = result.current.makeContext(panel.views[0]!);
		const betaAfter = result.current.makeContext(panel.views[1]!);
		expect(alphaAfter.isActiveView).toBe(false);
		expect(betaAfter.isActiveView).toBe(true);
	});
});
