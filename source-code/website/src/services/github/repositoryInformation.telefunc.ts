import { getContext } from "telefunc";

/**
 * You can get informations Like: Main repo, owner, updated at ....
 * https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#get-a-repository
 */
export async function repositoryInformation(args: {
  owner: string;
  repository: string;
}): Promise<any> {
  const context = getContext();
  const response = await fetch(
    `https://api.github.com/repos/${args.owner}/${args.repository}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${context.githubAccessToken}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );
  return response.ok ? await response.json() : undefined;
}
