import git from "isomorphic-git";

/**
 * Raw git cli api.
 *
 * Use for faster development iterations and progressively
 * develop own api layer on top.
 */
export const raw = git;
