import { getPrivateEnvVariables } from "./env.js"

// load env variables into the test environment
await getPrivateEnvVariables()

// no config needed
export default {}
