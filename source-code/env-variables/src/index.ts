// exports are tree shaken by apps. thus, not importing privateEnv
// will not include it in the bundle.
export { privateEnv } from "./privateEnv.js"
export { publicEnv } from "./publicEnv.js"
