import { getContext } from "telefunc";

export async function onFork(args: {
	owner: string;
	repository: string;
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
		const context = getContext();
		const response = await fetch(
			`https://api.github.com/repos/${args.owner}/${args.repository}/forks`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${context.githubAccessToken}`,
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

export async function syncFork(args: {
	owner: string;
	repository: string;
}): Promise<{
	status: number;
	message: string;
}> {
	const context = getContext();
	const response = await fetch(
		`https://api.github.com/repos/${args.owner}/${args.repository}/merge-upstream`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${context.githubAccessToken}`,
				"X-GitHub-Api-Version": "2022-11-28",
			},
			body: JSON.stringify({
				branch: "main",
			}),
		}
	);
	const responseMessage = await response.json();
	return {
		status: response.status,
		message: responseMessage.message,
	};
}
