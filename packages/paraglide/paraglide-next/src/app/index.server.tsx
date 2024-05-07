export { default as LanguageProvider } from "./providers/LanguageProvider.js"

// Public APIs
export { Middleware } from "./middleware"
export { Navigation } from "./navigation/navigation.server.js"
export { initializeLanguage } from "./initializeLanguage.server.js"

// Routing Strategies
export * from "./routing-strategy/strategies"
export type { RoutingStrategy } from "./routing-strategy/interface"

// Legacy
export { createI18n } from "./legacy/createI18n.server.js"
