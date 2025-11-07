import { act, renderHook } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
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
			views: [{ instanceKey: "alpha", viewKey: "custom" }],
			activeInstanceKey: "alpha",
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
			panel: { views: [], activeInstanceKey: null },
			isFocused: true,
			parentContext: parent,
		});
		expect(result.current.badgeCounts).toEqual({});
	});

	test("derives base context from parent", () => {
		const parent: ViewContext = createParentContext({
			isPanelFocused: false,
			openFileView: vi.fn(),
		});
		const panel: PanelState = {
			views: [{ instanceKey: "beta", viewKey: "custom" }],
			activeInstanceKey: "beta",
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
});
