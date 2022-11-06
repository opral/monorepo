import { serverSideEnv } from "@env";

// TODO implement jwt auth
export async function onAuth() {
	const env = await serverSideEnv();
	return {
		username: "samuelstroschein",
		password: env.GITHUB_PERSONAL_ACCESS_TOKEN as string,
	};
}
