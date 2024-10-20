/** @example `{host}/{owner}/{repository}` */
export type EditorRouteParams = {
  /** @example `github.com` */
  host: string;
  /** @example `inlang` */
  owner: string;
  /** @example `website` */
  repository: string;
};

export type EditorSearchParams = {
  /**
   * the current branch
   */
  branch?: string;
  /**
   * the current project
   */
  project?: string;
};
