import type { Change, LixFile } from "./schema.js";
import type { Lix } from "./types.js";

// named lixplugin to avoid conflict with built-in plugin type
export type LixPlugin<
	T extends Record<string, Record<string, unknown>> = Record<string, never>,
> = {
	key: string;
	glob: string;
	// TODO https://github.com/opral/lix-sdk/issues/37
	// idea:
	//   1. runtime reflection for lix on the change schema
	//   2. lix can validate the changes based on the schema
	// schema: {
	// 	bundle: Bundle,
	// 	message: Message,
	// 	variant: Variant,
	// },
	reportConflicts?: () => Promise<Array<unknown>>;
	applyChanges?: (args: {
		file: Readonly<LixFile>;
		changes: Readonly<Array<Readonly<Change<T[keyof T]>>>>;
		lix: Lix;
	}) => Promise<{
		fileData: LixFile["data"];
	}>;
	tryResolveConflict?: () => Promise<
		{ success: true; change: Change } | { success: false }
	>;
	// getting around bundling for the prototype
	setup?: () => Promise<void>;
	diffComponent?: {
		file?: () => HTMLElement;
	} & Record<
		// other primitives
		keyof T,
		(() => HTMLElement) | undefined
	>;
	diff: {
		file?: (args: {
			old?: LixFile;
			neu?: LixFile;
		}) => MaybePromise<Array<DiffReport>>;
	} & Record<
		// other primitives
		keyof T,
		(args: {
			old?: T[keyof T];
			neu?: T[keyof T];
		}) => MaybePromise<Array<DiffReport>>
	>;
};

type MaybePromise<T> = T | Promise<T>;

/**
 * A diff report is a report if a change has been made.
 */
export type DiffReport = {
	type: string;
	operation: "create" | "update" | "delete";
	old?: Record<string, any> & { id: string };
	neu?: Record<string, any> & { id: string };
	meta?: Record<string, any>;
} & (DiffReportCreate | DiffReportUpdate | DiffReportDeletion);

type DiffReportCreate = {
	operation: "create";
	old: undefined;
	neu: Record<string, any> & {
		id: string;
	};
};

type DiffReportUpdate = {
	operation: "update";
	old: Record<string, any> & {
		id: string;
	};
	neu: Record<string, any> & {
		id: string;
	};
};

type DiffReportDeletion = {
	operation: "delete";
	old: Record<string, any> & {
		id: string;
	};
	neu: undefined;
};
