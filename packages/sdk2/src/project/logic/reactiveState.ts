import { BehaviorSubject } from "rxjs";
import type { InlangPlugin } from "../../plugin/schema.js";
import type { ProjectSettings } from "../../schema/settings.js";

/**
 * Reactive state of the project.
 *
 * BehaviorSubject's are Readonly to prevent mutation bugs.
 * In case you wonder: The cost of structuredClone for every
 * getter or subscription is too high (internally).
 */
export type ReactiveState = {
	plugins$: BehaviorSubject<Readonly<InlangPlugin[]>>;
	errors$: BehaviorSubject<Readonly<Error[]>>;
	settings$: BehaviorSubject<Readonly<ProjectSettings>>;
};

export async function createReactiveState(args: {
	plugins: InlangPlugin[];
	errors: Error[];
	settings: ProjectSettings;
}): Promise<ReactiveState> {
	const plugins$ = new BehaviorSubject<Readonly<InlangPlugin[]>>(args.plugins);
	const errors$ = new BehaviorSubject<Readonly<Error[]>>(args.errors);
	const settings$ = new BehaviorSubject<Readonly<ProjectSettings>>(
		args.settings
	);

	return {
		plugins$,
		errors$,
		settings$,
	};
}
