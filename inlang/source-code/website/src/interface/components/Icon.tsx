import { type ComponentProps, lazy, Suspense } from "solid-js";

/**
 * Icons helper component when static imports are unavailable (for example markdown).
 *
 * Use iconify directly otherwise. The following sets are available:
 *  - material symbols https://icones.netlify.app/collection/material-symbols
 *  - core ui brands https://icones.netlify.app/collection/cib
 */
export function Icon(
  props: { name: AvailableIcon } & ComponentProps<"svg"> & {
      slot?: string;
    },
) {
  // eslint-disable-next-line solid/reactivity
  const ICON = lazy(() => icons[props.name]);
  return (
    // Suspense is required since the icons are lazy loaded.
    <Suspense>
      <ICON {...props} />
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
  fast: import("~icons/material-symbols/fast-forward-outline-rounded"),
  "add-plugin": import("~icons/material-symbols/extension-outline"),
  code: import("~icons/material-symbols/code-rounded"),
  badge: import("~icons/material-symbols/bar-chart-rounded"),
  external: import("~icons/material-symbols/arrow-outward-rounded"),
  vscode: import("~icons/cib/visual-studio-code"),
} as const;

/* Custom X icon as it is not available within unplugin */
export function IconX() {
  return (
    <svg
      width="19"
      height="auto"
      viewBox="0 0 24 23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18.8782 0.660156H22.5582L14.4782 9.86016L23.9182 22.3402H16.5102L10.7102 14.7562L4.07016 22.3402H0.390156L8.95016 12.5002L-0.0898438 0.660156H7.50216L12.7422 7.58816L18.8782 0.660156ZM17.5902 20.1802H19.6302L6.43016 2.74016H4.23816L17.5902 20.1802Z"
        fill="currentColor"
      />
    </svg>
  );
}
