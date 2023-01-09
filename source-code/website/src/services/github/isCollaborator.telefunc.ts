import { decryptAccessToken } from "../auth/logic.js";
import { serverSideEnv } from "@env";

const env = await serverSideEnv();

/**
 * Collaborator of a Github Repository,
 * Fetch function to get the Collaboraotr of a Github Repo.
 */
export async function isCollaborator(args: {
	owner: string;
	repository: string;
	encryptedAccessToken: string;
	username: string;
}) {
	const decryptedAccessToken = (
		await decryptAccessToken({
			jwe: args.encryptedAccessToken,
			JWE_SECRET_KEY: env.JWE_SECRET_KEY,
		})
	).unwrap();
	const response = await fetch(
		`https://api.github.com/repos/${args.owner}/${args.repository}/collaborators/${args.username}`,
		{
			headers: {
				Authorization: `Bearer ${decryptedAccessToken}`,
				"X-GitHub-Api-Version": "2022-11-28",
			},
		}
	);
	return response.ok;
}
