export { migrateProjectConfig } from "./migrate.js"
export { createProjectConfig } from "./create.js"

// TODO:
// -handle auto get versions, fetch, join functions
// - abort if git not clean?
// - rework warnigns and message formatting
// - check and implement config options for other plugins
// - check and implement other lint rules?
// - cli: prompt with instructions eg format to standard and its just best effort
// - only export from index file
// - inject logger instead of returning warnings?
// Support pathPattern object format
// 		"pathPattern": {
// 			"client-page": "app/i18n/locales/{languageTag}/client-page.json",
// 			"footer": "app/i18n/locales/{languageTag}/footer.json",
// 			"second-page": "app/i18n/locales/{languageTag}/second-page.json",
// 			"translation": "app/i18n/locales/{languageTag}/translation.json"
// 		}
// cli: console.info(`✅ Supported library found: ${pluginName}`)
