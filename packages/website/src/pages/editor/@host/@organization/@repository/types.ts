/** @example `{host}/{organization}/{repository}` */
export type EditorRouteParams = {
	/** @example `github.com` */
	host: string;
	/** @example `inlang` */
	organization: string;
	/** @example `website` */
	repository: string;
};

export type EditorSearchParams = {
	/**
	 * the current branch
	 *
	 * not implemented yet see https://github.com/inlang/inlang/discussions/166
	 */
	// branch?: string;
};
