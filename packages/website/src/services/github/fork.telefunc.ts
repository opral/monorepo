import { decryptAccessToken } from "../auth/logic.js";
import { serverSideEnv } from "@env";
const env = await serverSideEnv();

export async function onFork(args: {
	owner: string;
	repository: string;
	encryptedAccessToken: string;
	username: string;
}): Promise<
	| {
			type: "success";
			owner: string;
			repository: string;
	  }
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
/**
 * You can get more information than just the forking Information. Infos Like: Main repo, owner, updated at ....
 * https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#get-a-repository
 */
export async function isFork(args: {
	owner: string;
	repository: string;
	encryptedAccessToken: string;
	username: string;
}): Promise<
	| {
			type: "success";
			fork: boolean;
			parent_full_name: string;
			json: any;
	  }
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
			`https://api.github.com/repos/${args.owner}/${args.repository}`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${decryptedAccessToken}`,
					"X-GitHub-Api-Version": "2022-11-28",
				},
			}
		);

		if (response.ok) {
			const json = await response.json();
			return {
				type: "success",
				fork: json.fork,
				parent_full_name: json.source.full_name,
				json: json,
			};
		} else {
			throw Error(await response.text());
		}
	} catch (error) {
		return { type: "error", error: error };
	}
}

export async function syncFork(args: {
	owner: string;
	repository: string;
	encryptedAccessToken: string;
	username: string;
}): Promise<
	| {
			type: "success";
			status: number;
			message: any;
	  }
	| {
			type: "fail";
			status: number;
			message: any;
	  }
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
			`https://api.github.com/repos/${args.owner}/${args.repository}/merge-upstream`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${decryptedAccessToken}`,
					"X-GitHub-Api-Version": "2022-11-28",
				},
				body: JSON.stringify({
					branch: "main",
				}),
			}
		);
		console.log(response.status);
		const json = await response.json();

		if (response.status === 200) {
			return {
				type: "success",
				status: response.status,
				message: json.message,
			};
		} else if (response.status === 409 || 422) {
			return {
				type: "fail",
				status: response.status,
				message: json.message,
			};
		} else {
			//!! @jannesblobel
			throw response;
		}
	} catch (error) {
		return { type: "error", error: error };
	}
}
