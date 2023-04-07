// exports are tree shaken by apps. thus, not importing privateEnv
// will not include it in the bundle.
export { privateEnv } from "./src/privateEnv.js"
export { publicEnv, isDevelopment } from "./src/publicEnv.js"
