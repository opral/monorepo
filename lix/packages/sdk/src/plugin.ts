import type { LixFile } from "./schema.js"

// named lixplugin to avoid conflict with built-in plugin type
export type LixPlugin<T extends Record<string, Record<string, unknown>> = Record<string, never>> = {
	key: string
	glob: string
	// getting around bundling for the prototype
	setup?: () => Promise<void>
	diffComponent?: {
		file?: () => HTMLElement
	} & Record<
		// other primitives
		keyof T,
		(() => HTMLElement) | undefined
	>
	diff: {
		file?: (args: {
			old?: LixFile["data"]
			neu?: LixFile["data"]
			// TODO remove this hack in favor of
			// providing the entire lix file object
			path?: LixFile["path"]
		}) => MaybePromise<Array<DiffReport>>
	} & Record<
		// other primitives
		keyof T,
		(args: { old?: T[keyof T]; neu?: T[keyof T] }) => MaybePromise<Array<DiffReport>>
	>
}

type MaybePromise<T> = T | Promise<T>

/**
 * A diff report is a report if a change has been made.
 */
export type DiffReport = {
	type: string
	operation: "insert" | "update" | "delete"
	old?: Record<string, any> & { id: string }
	neu?: Record<string, any> & { id: string }
	meta?: Record<string, any>
} & (DiffReportInsertion | DiffReportUpdate | DiffReportDeletion)

type DiffReportInsertion = {
	operation: "insert"
	old: undefined
	neu: Record<string, any> & {
		id: string
	}
}

type DiffReportUpdate = {
	operation: "update"
	old: Record<string, any> & {
		id: string
	}
	neu: Record<string, any> & {
		id: string
	}
}

type DiffReportDeletion = {
	operation: "delete"
	old: Record<string, any> & {
		id: string
	}
	neu: undefined
}
