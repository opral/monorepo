// Public APIs
export { createMiddleware } from "./middleware"
export { createNavigation } from "./navigation/navigation.client.js"
export { initializeLanguage } from "./initializeLanguage.client.js"

// Routing Strategies
export { PrefixStrategy } from "./routing-strategy/prefixStrategy"
export { DomainStrategy } from "./routing-strategy/domainStrategy"

// Legacy
export { createI18n } from "./legacy/createI18n.client.js"
