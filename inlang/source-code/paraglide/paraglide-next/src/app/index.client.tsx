// Public APIs
export { Middleware } from "./middleware"
export { Navigation } from "./navigation/navigation.client.js"
export { initializeLanguage } from "./initializeLanguage.client.js"

// Routing Strategies
export * from "./routing-strategy/strategies"
export type { RoutingStrategy } from "./routing-strategy/interface"

// Legacy
export { createI18n } from "./legacy/createI18n.client.js"
