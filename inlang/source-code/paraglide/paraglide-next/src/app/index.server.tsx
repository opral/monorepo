export { default as LanguageProvider } from "./providers/LanguageProvider.js"

// Public APIs
export { createMiddleware } from "./middleware"
export { createNavigation } from "./navigation/navigation.server.js"
export { initializeLanguage } from "./initializeLanguage.server.js"

// Routing Strategies
export { PrefixStrategy } from "./routing-strategy/prefixStrategy"
export { DomainStrategy } from "./routing-strategy/domainStrategy"

// Legacy
export { createI18n } from "./legacy/createI18n.server.js"
