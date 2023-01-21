import { serverSideEnv } from "@env";
import express from "express";
import {
	encryptAccessToken,
	exchangeInterimCodeForAccessToken,
} from "./logic.js";
import crypto from "crypto";
import {
	InlangSessionRequest,
	createSession,
	verifyInlangSession,
} from "./session/server.js";

export const router = express.Router();

const env = await serverSideEnv();

/**
 * OAuth flow from GitHub
 *
 * Be aware that the route set here is prefixed with /services/auth
 * and that the route is set in the GitHub OAuth app settings.
 */
router.get(
	"/github-oauth-callback",
	verifyInlangSession({ sessionRequired: false }),
	async (request: InlangSessionRequest, response, next) => {
		try {
			const code = request.query.code as string;
			const accessToken = await exchangeInterimCodeForAccessToken({
				code,
				env,
			});

			const encryptedAccessToken = await encryptAccessToken({
				accessToken,
				JWE_SECRET_KEY: env.JWE_SECRET_KEY,
			});

			let session = request.session;
			if (!session) {
				session = await createSession(
					response,
					crypto.randomBytes(20).toString("hex")
				);
			}

			const sessionData = await session.getSessionData();

			// Update the supertokens session
			session.updateSessionData({
				...sessionData,
				encryptedAccessToken,
			});

			response.redirect("/services/auth/oauth-callback");
		} catch (error) {
			next(error);
		}
	}
);

/**
 * Sign out by revoking the session
 */
router.post(
	"/sign-out",
	verifyInlangSession({ sessionRequired: true }),
	async (req: InlangSessionRequest, res) => {
		// This will delete the session from the db and from the frontend (cookies)
		console.log("session", req.session);
		if (req.session) {
			await req.session.revokeSession();
		}

		res.status(200).send("signed out");
	}
);
