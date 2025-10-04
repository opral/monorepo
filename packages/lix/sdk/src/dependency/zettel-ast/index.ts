/**
 * Re-exporting the Zettel AST to make the getting started easier.
 *
 * Developers need access to the Zettel AST types when dealing
 * with comments. Forcing lix dev's to install @opral/zettel-ast
 * as a dependency in addition to the lix SDK is not ideal.
 *
 * Re-exporting from a subpath to avoid name collisions.
 */
export * from "@opral/zettel-ast";
