// This is fragile af since it exports a server-only component
// we rely on experimental.optimizePackageImports to optimize this barrel away & remove the server-only component
// in future we should have a client & server version of this file

export { default as LanguageProvider } from "./app/LanguageProvider.jsx"
export { paraglideMiddleware } from "./app/middleware.jsx"
export * from "./app/navigation"
