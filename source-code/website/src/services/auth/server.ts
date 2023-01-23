import { serverSideEnv } from "@env";
import express from "express";
import {
  encryptAccessToken,
  exchangeInterimCodeForAccessToken,
} from "./logic.js";
import crypto from "crypto";
import { createSession, verifyInlangSession } from "./lib/session/server.js";
import type { InlangSessionRequest } from "./lib/session/types.server.js";

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
 * Sign out by revoking the session if one exists.
 * Returns 401 if the accessToken is no longer valid. A correctly initialized frontend will then attempt to refresh the session and call the route again.
 */
router.post(
  "/sign-out",
  verifyInlangSession({ sessionRequired: false }),
  async (req: InlangSessionRequest, res) => {
    // This will delete the session from the db and from the frontend (cookies)
    if (req.session) {
      await req.session.revokeSession();
    }

    res.status(204).send("signed out");
  }
);

/**
 * Creates a new session if the requesting client doesn't already have one.
 * Returns 401 if the accessToken is no longer valid. A correctly initialized frontend will then attempt to refresh the session and call the route again.
 */
router.post(
  "/create-session",
  verifyInlangSession({ sessionRequired: false }),
  async (req: InlangSessionRequest, res) => {
    if (!req.session) {
      const session = await createSession(res, Math.random().toString());
    }

    res.status(201).send("Created session or session already existed.");
  }
);
