import { validateEnvVariables } from "./env.js"

// load env variables into the test environment
await validateEnvVariables()

// no config needed
export default {}
