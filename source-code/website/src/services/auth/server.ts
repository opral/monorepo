import { serverSideEnv } from "@env";
import express from "express";
import {
  encryptAccessToken,
  exchangeInterimCodeForAccessToken,
} from "./logic.js";

export const router = express.Router();

const env = await serverSideEnv();

/**
 * OAuth flow from GitHub
 *
 * Be aware that the route set here is prefixed with /services/auth
 * and that the route is set in the GitHub OAuth app settings.
 */
router.get("/github-oauth-callback", async (request, response, next) => {
  try {
    const code = request.query.code as string;
    const accessToken = await exchangeInterimCodeForAccessToken({ code, env });
    const encryptedAccessToken = await encryptAccessToken({
      accessToken,
      JWE_SECRET_KEY: env.JWE_SECRET_KEY,
    });
    // set the session
    request.session = {
      encryptedAccessToken,
    };
    response.redirect("/services/auth/oauth-callback");
  } catch (error) {
    next(error);
  }
});

/**
 * Sign out by setting the session to undefined.
 */
router.post("/sign-out", (request, response) => {
  request.session = undefined;
  response.status(201).send();
});
