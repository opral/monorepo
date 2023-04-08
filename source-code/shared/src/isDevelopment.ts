/**
 * isDevelopment is not part of lib/env/ because it
 * only reflects the environment of this module, not
 * the environment code that imports lib/env/.
 */

import { publicEnv } from "../lib/env/index.js"

/**
 * Is the application running in development mode?
 */
// @ts-expect-error - DEV is defined in build step
export const isDevelopment = publicEnv.PUBLIC_IS_DEV ? true : false
