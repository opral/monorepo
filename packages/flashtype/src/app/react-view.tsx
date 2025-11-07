import type { ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { LucideIcon } from "lucide-react";
import type {
	ViewContext,
	ViewDefinition,
	ViewInstance,
	ViewKey,
} from "./types";

type ReactRenderer = (args: {
	context: ViewContext;
	instance: ViewInstance;
}) => ReactNode;

type ReactActivator = (args: {
	context: ViewContext;
	instance: ViewInstance;
}) => void | (() => void);

export function createReactViewDefinition(args: {
	key: ViewKey;
	label: string;
	description: string;
	icon: LucideIcon;
	component: ReactRenderer;
	activate?: ReactActivator;
}): ViewDefinition {
	const ROOT_SLOT = Symbol.for("flashtype.reactRoot");

	return {
		key: args.key,
		label: args.label,
		description: args.description,
		icon: args.icon,
		activate: args.activate,
		render: ({ context, instance, target }) => {
			let root = (target as unknown as Record<symbol, Root | undefined>)[
				ROOT_SLOT
			];
			if (!root) {
				root = createRoot(target);
				(target as unknown as Record<symbol, Root | undefined>)[ROOT_SLOT] =
					root;
			}
			root.render(args.component({ context, instance }));
			return () => {
				root?.render(null);
			};
		},
	};
}
