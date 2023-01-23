/**
 * Session logic for the backend using supertokens for production and a simplified local version for simpler development.
 * Opt in to supertokens in development by setting the env variable 'VITE_SUPERTOKENS_IN_DEV' to 'true'.
 * Also check to set the other required env vars, which are listed in the development setup guid.
 * @see <ADD_URL>
 * @see https://supertokens.com/docs/session/introduction
 * @author Leo Grützner
 */

import { verifySession } from "supertokens-node/recipe/session/framework/express/index.js";
import { middleware as supertokensMiddleware } from "supertokens-node/framework/express/index.js";
import cookie from "cookie";
import Session from "supertokens-node/recipe/session";
import crypto from "crypto";
import { serverSideEnv } from "@env";
import supertokens from "supertokens-node";
import { errorHandler as supertokensErrorHandler } from "supertokens-node/framework/express";
import type { TypeInput } from "supertokens-node/lib/build/types.js";
import { LOCAL_SESSION_COOKIE_NAME } from "./types.js";
import type {
  InlangSession,
  InlangSessionCacheEntry,
  InlangSessionMiddleware,
  InlangSessionRequest,
} from "./types.server.js";
import type { Request, Response, NextFunction } from "express";
import { getLocalSessionCookie } from "./shared.js";

const env = await serverSideEnv();

const config: TypeInput = {
  framework: "express",
  supertokens: {
    // These are the connection details of the app you created on supertokens.com
    connectionURI: env.SUPERTOKENS_CONNECTION_URI!,
    apiKey: env.SUPERTOKENS_API_KEY!,
  },
  appInfo: {
    // learn more about this on https://supertokens.com/docs/session/appinfo
    appName: env.VITE_SUPERTOKENS_APP_NAME ?? "inlang",
    apiDomain: env.VITE_FRONTEND_BASE_URL!,
    websiteDomain: env.VITE_FRONTEND_BASE_URL!,
    apiBasePath: "/",
  },
  recipeList: [Session.init({})],
};

let sessionStorage: Record<string, InlangSessionCacheEntry>;

const supertokensEnabled =
  env.NODE_ENV == "production" || env.VITE_SUPERTOKENS_IN_DEV !== undefined;

/**
 * Initializes the session logic, which must happen in the backend before any other supertokens functions are called. Check to set the required env vars, if working with supertokens, which is by disabled in the development environment by default.
 */
export const initSession = () => {
  if (supertokensEnabled) {
    supertokens.init(config);
  } else {
    console.info(
      "Supertokens session disabled for the dev environment. Enable by setting the env var 'SUPERTOKENS_ENABLE' to 'true'"
    );
  }
};

/**
 * Inlang session middleware for express
 * Use in API routes when working with a session
 * @param args sessionRequired: if true, the request will be rejected if no VALID session is linked to the request or if the
 * @example app.use(verifyInlangSession({ sessionRequired: false }));
 */
export const verifyInlangSession = (args: {
  sessionRequired: boolean;
}): InlangSessionMiddleware => {
  if (supertokensEnabled) {
    return verifySession(args) as InlangSessionMiddleware;
  } else {
    return async (
      req: InlangSessionRequest,
      res: Response,
      next: NextFunction
    ) => {
      const handle = getLocalSessionCookie(
        req.header("cookie") ?? "",
        LOCAL_SESSION_COOKIE_NAME.SESSION_ID
      );

      const unauthorized = () => {
        res.status(401).json({ message: "Unauthorized" });
      };

      if (handle) {
        req.session = getLocalSession(res, handle);
        if (args.sessionRequired && !req.session) {
          return unauthorized();
        }
      } else if (args.sessionRequired) {
        return unauthorized();
      }

      next();
    };
  }
};

/** Add this middleware before you use verifySession or getSession in an API route
 * @returns Express middleware
 * @example app.use(sessionMiddleware());
 */
export const sessionMiddleware = () => {
  if (supertokensEnabled) {
    return [
      // if we'll need to add cors support, this would be the place to do it
      // check: https://supertokens.com/docs/session/quick-setup/backend
      supertokensMiddleware(),
    ];
  } else {
    return [
      async (req: Request, res: Response, next: NextFunction) => {
        next();
      },
    ];
  }
};

/**
 * Creates a session using supertokens for production and a simplified local session logic for development.
 * @param res Express response object
 * @param userId User id
 * @param accessTokenPayload Access token payload
 * @param sessionData Session data
 * @returns Session object
 * @throws Error if supertokens is enabled and the session creation fails
 */
export const createSession = (
  res: Response,
  userId: string,
  accessTokenPayload?: any,
  sessionData?: any
) => {
  if (supertokensEnabled) {
    return Session.createNewSession(
      res,
      userId,
      accessTokenPayload,
      sessionData
    );
  } else {
    return createLocalSession(res, userId, accessTokenPayload, sessionData);
  }
};

/**
 * Creates a session object that can be attached to the request object (dev replacement for supertokens request.session)
 * @param res Express response object
 * @param userId User id
 * @param accessTokenPayload Access token payload
 * @param sessionData Session data
 * @returns Cache session object
 */
const createLocalSession = (
  res: Response,
  userId: string,
  accessTokenPayload?: any,
  sessionData?: any
): InlangSession => {
  const handle = createCacheSession(userId, sessionData);
  setLocalSessionCookieHeader(
    res,
    LOCAL_SESSION_COOKIE_NAME.SESSION_ID,
    handle,
    { httpOnly: true }
  );

  if (accessTokenPayload) {
    setLocalSessionCookieHeader(
      res,
      LOCAL_SESSION_COOKIE_NAME.ACCESS_TOKEN_PAYLOAD,
      accessTokenPayload,
      { httpOnly: false }
    );
  }

  return getLocalSession(res, handle);
};

/**
 * Constructs a session object from a session chache entry that can be attached to the request object (dev replacement for supertokens request.session)
 * @param res Express response object
 * @param handle Session hanlde
 * @returns Cache session object
 */
const getLocalSession = (res: Response, handle: string): InlangSession => {
  if (!sessionStorage) {
    sessionStorage = {};
  }

  const session: InlangSession = {
    getSessionData: async () => {
      return handle && sessionStorage[handle];
    },
    updateSessionData: async (data) => {
      sessionStorage[handle] = data;
      return handle && data;
    },
    revokeSession: async () => {
      delete sessionStorage[handle];
    },
    getHandle: () => handle,
    updateAccessTokenPayload: async (payload: any) => {
      setLocalSessionCookieHeader(
        res,
        LOCAL_SESSION_COOKIE_NAME.ACCESS_TOKEN_PAYLOAD,
        payload,
        { httpOnly: false }
      );
    },
  };

  return session;
};

/**
 * Create a session in the cache (for dev environment)
 * @param userId UserId for the session
 * @param sessionData Unserialized session data
 * @returns Session handle
 */
const createCacheSession = (userId: string, sessionData?: any) => {
  const sessionEntry: InlangSessionCacheEntry = {
    handle: crypto.randomBytes(20).toString("hex"),
    userId,
    data: sessionData ?? {},
  };

  if (!sessionStorage) {
    sessionStorage = {};
  }

  sessionStorage[sessionEntry.handle] = sessionEntry;
  return sessionEntry.handle;
};

/**
 * Express error handler for the inlang session implementation
 * @returns Express error handler
 */
export const sessionErrorHandler = () => {
  if (supertokensEnabled) {
    return supertokensErrorHandler();
  } else {
    return async (
      err: any,
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      next(err);
    };
  }
};

/**
 * Add a cookie to the response header
 * @param response Express response object
 * @param type Cookie type form LOCAL_SESSION_COOKIE_NAME
 * @param value Unserialized value
 * @param options Cookie options like httpOnly
 * @returns void
 */
const setLocalSessionCookieHeader = (
  res: Response,
  type: LOCAL_SESSION_COOKIE_NAME,
  value: string | undefined,
  options: { httpOnly: boolean }
) => {
  res.setHeader(
    "Set-Cookie",
    cookie.serialize(type, JSON.stringify(value ?? null), {
      httpOnly: options.httpOnly,
      path: "/",
    })
  );
};
