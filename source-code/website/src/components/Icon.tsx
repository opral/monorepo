import { ComponentProps, lazy, Suspense } from "solid-js";

/**
 * Icons available throughout inlang.
 *
 * Lazy loads icons under the hood. Bundling external
 * icons under this component ensures consistency across
 * the app with regards to the icons that are used.
 */
export function Icon(
	props: { name: AvailableIcon } & ComponentProps<"svg"> & {
			slot?: string;
		}
) {
	const ICON = lazy(() => icons[props.name]);
	return (
		// Suspense is required since the icons are lazy loaded.
		<Suspense>
			<ICON {...props}></ICON>
		</Suspense>
	);
}

/**
 * The available icons.
 */
export type AvailableIcon = keyof typeof icons;

// if you'd like to add icons, the following sets are available:
//  - material symbols https://icones.netlify.app/collection/material-symbols
//  - core ui brands https://icones.netlify.app/collection/cib
//
// the available icon sets are defined in the `package.json` file.
// look out for "@iconify-json/*": "*" dependencies
export const icons = {
	success: import("~icons/material-symbols/check-circle-outline-rounded"),
	danger: import("~icons/material-symbols/dangerous-outline-rounded"),
	info: import("~icons/material-symbols/info-outline-rounded"),
	warning: import("~icons/material-symbols/warning-outline-rounded"),
	"turn-slight-left": import(
		"~icons/material-symbols/turn-slight-left-rounded"
	),
	architecture: import("~icons/material-symbols/architecture-rounded"),
	construction: import("~icons/material-symbols/construction-rounded"),
} as const;
