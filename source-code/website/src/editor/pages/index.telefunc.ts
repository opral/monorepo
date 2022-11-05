import { raw, http } from "@inlang/git-sdk/api";
import { serverSideEnv } from "@env";
import { fs } from "@inlang/git-sdk/fs";

/**
 * @deprecated Only use for testing. Remove afterwards.
 */
export async function getAccessToken() {
	const env = await serverSideEnv();
	return env.GITHUB_PERSONAL_ACCESS_TOKEN as string;
}
