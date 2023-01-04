import { Result } from "@inlang/core/utilities";

export async function isCollaborator(args: {
	owner: string;
	repository: string;
	decryptedAccessToken: string;
	username: string;
}): Promise<Result<boolean, Error>> {
	try {
		const collaborator = await fetch(
			`https://api.github.com/repos/${args.owner}/${args.repository}/collaborators/${args.username}`,
			{
				headers: {
					Authorization: `Bearer ${args.decryptedAccessToken}`,
				},
			}
		);
		return Result.ok(collaborator.ok);
	} catch (error) {
		return Result.err(error as Error);
	}
}
