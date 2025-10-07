import {
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";

type KeepPreviousSuspenseProps = {
	/**
	 * Child content that may suspend. When it does, the last settled children
	 * remain visible instead of falling back to an empty placeholder.
	 */
	children: ReactNode;
	/**
	 * Optional fallback rendered when the content suspends before anything has
	 * resolved. Defaults to `null`.
	 */
	fallback?: ReactNode;
};

/**
 * Suspense wrapper that keeps the previous content visible while new children
 * suspend, avoiding the blank flash that occurs with traditional fallbacks.
 *
 * @example
 * ```tsx
 * <KeepPreviousSuspense fallback={<div>Loading…</div>}>
 *   <HeavyPanel />
 * </KeepPreviousSuspense>
 * ```
 */
export function KeepPreviousSuspense({
	children,
	fallback = null,
}: KeepPreviousSuspenseProps): ReactNode {
	const [lastSettled, setLastSettled] = useState<ReactNode | null>(null);
	const lastSettledRef = useRef<ReactNode | null>(lastSettled);

	const recordSettledChild = useCallback(
		(node: ReactNode) => {
			if (Object.is(lastSettledRef.current, node)) {
				return;
			}
			lastSettledRef.current = node;
			setLastSettled(node);
		},
		[setLastSettled],
	);

	const suspenseFallback = useMemo(
		() => (lastSettled !== null ? lastSettled : fallback ?? null),
		[lastSettled, fallback],
	);

	return (
		<Suspense fallback={suspenseFallback}>
			<SuspenseSettler onSettled={recordSettledChild}>{children}</SuspenseSettler>
		</Suspense>
	);
}

function SuspenseSettler({
	children,
	onSettled,
}: {
	children: ReactNode;
	onSettled: (node: ReactNode) => void;
}): ReactNode {
	useEffect(() => {
		onSettled(children);
	}, [children, onSettled]);
	return <>{children}</>;
}
