import { decryptAccessToken } from "../auth/logic.js";
import { serverSideEnv } from "@env";
const env = await serverSideEnv();

export async function onFork(args: {
	owner: string;
	repository: string;
	encryptedAccessToken: string;
	username: string;
}): Promise<
	| { type: "success"; owner: string; repository: string }
	| { type: "error"; error: any }
> {
	try {
		const decryptedAccessToken = (
			await decryptAccessToken({
				jwe: args.encryptedAccessToken,
				JWE_SECRET_KEY: env.JWE_SECRET_KEY,
			})
		).unwrap();
		const response = await fetch(
			`https://api.github.com/repos/${args.owner}/${args.repository}/forks`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${decryptedAccessToken}`,
					"X-GitHub-Api-Version": "2022-11-28",
				},
				// body: JSON.stringify({
				// 	name: `inlangTranslationFor-${args.owner}-${args.repository}`,
				// }),
			}
		);
		if (response.ok) {
			const json = await response.json();
			return {
				type: "success",
				owner: json.owner.login,
				repository: json.name,
			};
		} else {
			throw Error(await response.text());
		}
	} catch (error) {
		return { type: "error", error: error };
	}
}
