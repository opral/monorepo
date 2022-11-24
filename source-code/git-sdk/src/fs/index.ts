/**
 * !Carefull: Use fs.promise wherever possible!
 *
 * isomorphic-git has a bug that makes working with fs.promise
 * impossible.
 */
export { fs } from "memfs";
