import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PanelState, ViewContext, ViewInstance } from "./types";

type UsePanelViewContextArgs = {
	panel: PanelState;
	isFocused: boolean;
	parentContext?: ViewContext;
};

export function useViewContext({
	panel,
	isFocused,
	parentContext,
}: UsePanelViewContextArgs): {
	badgeCounts: Record<string, number>;
	makeContext: (instance: ViewInstance) => ViewContext | undefined;
} {
	const baseContext = useMemo<ViewContext | undefined>(() => {
		if (!parentContext) return { isPanelFocused: isFocused };
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
				if (!panel.views.some((view) => view.instanceKey === key)) {
					delete next[key];
					mutated = true;
				}
			}
			return mutated ? next : prev;
		});

		for (const key of Object.keys(setterRef.current)) {
			if (!panel.views.some((view) => view.instanceKey === key)) {
				delete setterRef.current[key];
				delete contextRef.current[key];
			}
		}
	}, [panel.views]);

	const getBadgeSetter = useCallback(
		(instanceKey: string) => {
			const cached = setterRef.current[instanceKey];
			if (cached) return cached;
			const setter = (count: number | null | undefined) => {
				setBadgeCounts((prev) => {
					if (
						count === null ||
						count === undefined ||
						!Number.isFinite(count) ||
						Number(count) <= 0
					) {
						if (!(instanceKey in prev)) return prev;
						const { [instanceKey]: _, ...rest } = prev;
						return rest;
					}
					const normalized = Number(count);
					if (prev[instanceKey] === normalized) return prev;
					return { ...prev, [instanceKey]: normalized };
				});
			};
			setterRef.current[instanceKey] = setter;
			return setter;
		},
		[],
	);

	useEffect(() => {
		contextRef.current = {};
	}, [baseContext]);

	const makeContext = useCallback(
		(instance: ViewInstance): ViewContext | undefined => {
			const setCount = getBadgeSetter(instance.instanceKey);
			const cached = contextRef.current[instance.instanceKey];
			const focusValue = baseContext?.isPanelFocused ?? isFocused;
			if (
				cached &&
				cached.setTabBadgeCount === setCount &&
				cached.isPanelFocused === focusValue
			) {
				return cached;
			}

			const next: ViewContext = baseContext
				? { ...baseContext, setTabBadgeCount: setCount }
				: { isPanelFocused: isFocused, setTabBadgeCount: setCount };
			contextRef.current[instance.instanceKey] = next;
			return next;
		},
		[baseContext, getBadgeSetter, isFocused],
	);

	return { badgeCounts, makeContext };
}
