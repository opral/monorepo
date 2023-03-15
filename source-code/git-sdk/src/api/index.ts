import _git from "isomorphic-git"
import _http from "isomorphic-git/http/web/index.js"

// following below docs for bundling the wasm file:
// https://github.com/rollup/plugins/tree/master/packages/wasm/#usage-1

// @ts-ignore
// TODO: it doesn't like this import, can't find the file
// > Failed to resolve import "../lg2.wasm" from "../git-sdk/dist/api/index.js". Does the file exist?
//  rollup -c completes without errors though
import wasm from "../lg2.wasm"

export const libgit = wasm

/**
 * Raw git cli api.
 *
 * The idea of the `git-sdk` is to abstract working with git as
 * a CLI. Sometimes access to the "raw" git CLI is required to
 * achieve actions that are unsupported, or not yet, supported
 * by the `git-sdk`. Esepcially useful for faster development
 * iterations and progressively develop own api layer on top.
 */
export const raw = _git

/**
 * The http client for the git raw api.
 *
 * Note: The http client is web-based. Node version 18 is
 * required for the http client to work in node environments.
 */
export const http = _http
