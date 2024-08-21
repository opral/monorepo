import { BehaviorSubject } from "rxjs";
import type { InlangPlugin } from "../../plugin/schema.js";
import type { ProjectSettings } from "../../schema/settings.js";

/**
 * State of a project.
 *
 * BehaviorSubject's are Readonly to prevent mutation bugs.
 * In case you wonder: The cost of structuredClone for every
 * getter or subscription is too high (internally).
 */
export type State = Awaited<ReturnType<typeof createState>>;

export async function createState(args: {
	plugins: InlangPlugin[];
	errors: Error[];
	settings: ProjectSettings;
}) {
	/**
	 * Pending promises are used for the `project.settled()` api.
	 */
	// TODO implement garbage collection/a proper queue. 
	//      for the protoype and tests, it seems good enough
	//      without garbage collection of old promises. 
	const pendingPromises: Promise<unknown>[] = [];

	const plugins$ = new BehaviorSubject<Readonly<InlangPlugin[]>>(args.plugins);
	const errors$ = new BehaviorSubject<Readonly<Error[]>>(args.errors);
	const settings$ = new BehaviorSubject<Readonly<ProjectSettings>>(
		args.settings
	);

	return {
		pendingPromises,
		plugins$,
		errors$,
		settings$,
	};
}
