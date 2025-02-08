/**
 * This is a re-export of the path-to-regexp library.
 * 
 * The bundling is required to (1) avoid dependency resolution issues
 * because paraglide emits into source code and (2) enable tree-shaking
 * by tricking the bundler to treat path-to-regexp as ESM instead of
 * CJS dependency. 
 *
 * See https://github.com/pillarjs/path-to-regexp for more information.
 */
export { match, compile } from "path-to-regexp";
