import { serverSideEnv } from "@env";
import type { OnBeforeRender } from "@src/renderer/types.js";
import {
	encryptAccessToken,
	exchangeInterimCodeForAccessToken,
	getUserInfo,
} from "./logic.js";
import type { PageProps } from "./oauth-redirect.page.jsx";

const env = await serverSideEnv();

/**
 * Exchange the `code` for an access token, encrypt it, and pass it to the client.
 *
 * Read more here https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#2-users-are-redirected-back-to-your-site-by-github
 */
export const onBeforeRender: OnBeforeRender<PageProps> = async (
	pageContext
) => {
	try {
		const code = pageContext.urlParsed.search["code"];
		const accessToken = (
			await exchangeInterimCodeForAccessToken({ code, env })
		).unwrap();
		const encryptedAccessToken = (
			await encryptAccessToken({
				accessToken,
				JWE_SECRET_KEY: env.JWE_SECRET_KEY,
			})
		).unwrap();
		const user = (await getUserInfo({ accessToken })).unwrap();
		return {
			pageContext: {
				pageProps: {
					data: {
						user: {
							...user,
							encryptedAccessToken,
						},
					},
				},
			},
		};
	} catch (error) {
		console.error(error);
		return {
			pageContext: {
				pageProps: {
					error: (error as Error)?.toString() ?? "Unknown error",
				},
			},
		};
	}
};
