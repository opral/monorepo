import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PanelState, ViewContext, ViewInstance } from "./types";

type UsePanelViewContextArgs = {
	panel: PanelState;
	isFocused: boolean;
	parentContext: ViewContext;
};

export function useViewContext({
	panel,
	isFocused,
	parentContext,
}: UsePanelViewContextArgs): {
	badgeCounts: Record<string, number>;
	makeContext: (instance: ViewInstance) => ViewContext;
} {
	const baseContext = useMemo<ViewContext>(() => {
		if (parentContext.isPanelFocused === isFocused) return parentContext;
		return { ...parentContext, isPanelFocused: isFocused };
	}, [parentContext, isFocused]);

	const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({});
	const setterRef = useRef<
		Record<string, (count: number | null | undefined) => void>
	>({});
	const contextRef = useRef<Record<string, ViewContext>>({});

	useEffect(() => {
		setBadgeCounts((prev) => {
			const next = { ...prev };
			let mutated = false;
			for (const key of Object.keys(prev)) {
				if (!panel.views.some((view) => view.instance === key)) {
					delete next[key];
					mutated = true;
				}
			}
			return mutated ? next : prev;
		});

		for (const key of Object.keys(setterRef.current)) {
			if (!panel.views.some((view) => view.instance === key)) {
				delete setterRef.current[key];
				delete contextRef.current[key];
			}
		}
	}, [panel.views]);

	const getBadgeSetter = useCallback((instanceId: string) => {
		const cached = setterRef.current[instanceId];
		if (cached) return cached;
		const setter = (count: number | null | undefined) => {
			setBadgeCounts((prev) => {
				if (
					count === null ||
					count === undefined ||
					!Number.isFinite(count) ||
					Number(count) <= 0
				) {
					if (!(instanceId in prev)) return prev;
					const { [instanceId]: _, ...rest } = prev;
					return rest;
				}
				const normalized = Number(count);
				if (prev[instanceId] === normalized) return prev;
				return { ...prev, [instanceId]: normalized };
			});
		};
		setterRef.current[instanceId] = setter;
		return setter;
	}, []);

	useEffect(() => {
		contextRef.current = {};
	}, [baseContext]);

	const makeContext = useCallback(
		(instance: ViewInstance): ViewContext => {
			const setCount = getBadgeSetter(instance.instance);
			const cached = contextRef.current[instance.instance];
			const focusValue = baseContext.isPanelFocused ?? isFocused;
			const isActiveView = panel.activeInstance === instance.instance;
			if (
				cached &&
				cached.setTabBadgeCount === setCount &&
				cached.isPanelFocused === focusValue &&
				cached.isActiveView === isActiveView
			) {
				return cached;
			}

			const next: ViewContext = {
				...baseContext,
				setTabBadgeCount: setCount,
				isActiveView,
				isPanelFocused: focusValue,
			};
			contextRef.current[instance.instance] = next;
			return next;
		},
		[baseContext, getBadgeSetter, isFocused, panel.activeInstance],
	);

	return { badgeCounts, makeContext };
}
