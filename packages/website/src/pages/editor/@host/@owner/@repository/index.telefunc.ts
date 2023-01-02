import { serverSideEnv } from "@env";
import { Result } from "@inlang/core/utilities";
import { createAuthHeader } from "@src/services/auth/index.js";
import { decryptAccessToken } from "@src/services/auth/logic.js";
import type { LocalStorageSchema } from "@src/services/local-storage/schema.js";
import { result } from "lodash-es";

const env = await serverSideEnv();
export async function forkRepository(args: {
	encryptedAccessToken: NonNullable<
		LocalStorageSchema["user"]
	>["encryptedAccessToken"];
}) {
	try {
		const decryptedAccessToken = decryptAccessToken({
			jwe: args.encryptedAccessToken,
			JWE_SECRET_KEY: env.JWE_SECRET_KEY,
		});
		console.log("vor dem fecht");
		const fork = await fetch(
			`https://api.github.com/repos/inlang/example/forks`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${decryptedAccessToken}`,
				},

				body: JSON.stringify({ name: "inlangTranslation" }),
			}
		);
		console.log("nach dem fetch", fork);
		if (fork.ok) {
			return Result.ok(undefined);
		} else throw Error(await fork.text());
	} catch (error) {
		return Result.err(error as Error);
	}
}

export function hello() {
	console.log("hello");
}
