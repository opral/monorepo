import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useRef,
	type ReactNode,
} from "react";
import type { ViewContext, ViewDefinition, ViewInstance } from "./types";

export type ViewHostRecord = {
	readonly instanceId: string;
	readonly container: HTMLDivElement;
	view: ViewDefinition;
	instance: ViewInstance;
	cleanup: (() => void) | undefined;
	lastContext: ViewContext;
};

type EnsureArgs = {
	instance: ViewInstance;
	view: ViewDefinition;
	context: ViewContext;
};

type ViewHostRegistry = {
	ensureHost: (args: EnsureArgs) => ViewHostRecord;
	pruneHosts: (activeInstances: Set<string>) => void;
};

const ViewHostRegistryContext = createContext<ViewHostRegistry | null>(null);

export function ViewHostRegistryProvider({
	children,
}: {
	children: ReactNode;
}) {
	const hostsRef = useRef<Map<string, ViewHostRecord>>(new Map());

	const ensureHost = useCallback(
		({ instance, view, context }: EnsureArgs): ViewHostRecord => {
			let record = hostsRef.current.get(instance.instance);
			if (!record) {
				const container = document.createElement("div");
				container.className =
					"flex min-h-0 flex-1 flex-col overflow-hidden w-full h-full";
				const maybeCleanup = view.render({
					context,
					instance,
					target: container,
				});
				const cleanup =
					typeof maybeCleanup === "function" ? maybeCleanup : undefined;
				record = {
					instanceId: instance.instance,
					container,
					view,
					instance,
					cleanup,
					lastContext: context,
				};
				hostsRef.current.set(instance.instance, record);
				return record;
			}

			record.cleanup?.();
			const maybeCleanup = view.render({
				context,
				instance,
				target: record.container,
			});
			record.cleanup =
				typeof maybeCleanup === "function" ? maybeCleanup : undefined;
			record.instance = instance;
			record.view = view;
			record.lastContext = context;
			return record;
		},
		[],
	);

	const pruneHosts = useCallback((activeInstances: Set<string>) => {
		for (const [key, record] of hostsRef.current) {
			if (activeInstances.has(key)) continue;
			record.cleanup?.();
			record.container.remove();
			hostsRef.current.delete(key);
		}
	}, []);

	const value = useMemo<ViewHostRegistry>(
		() => ({
			ensureHost,
			pruneHosts,
		}),
		[ensureHost, pruneHosts],
	);

	return (
		<ViewHostRegistryContext.Provider value={value}>
			{children}
		</ViewHostRegistryContext.Provider>
	);
}

export function useViewHostRegistry(): ViewHostRegistry {
	const ctx = useContext(ViewHostRegistryContext);
	if (!ctx) {
		throw new Error("useViewHostRegistry must be used within the provider.");
	}
	return ctx;
}
