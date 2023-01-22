import { verifySession } from "supertokens-node/recipe/session/framework/express/index.js";
import { middleware as supertokensMiddleware } from "supertokens-node/framework/express/index.js";
import cookie from "cookie";
import Session from "supertokens-node/recipe/session";
import crypto from "crypto";
import { serverSideEnv } from "@env";
import supertokens from "supertokens-node";
import { errorHandler as supertokensErrorHandler } from "supertokens-node/framework/express";
import cors from "cors";
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
		apiDomain: env.SUPERTOKENS_CONNECTION_URI!,
		websiteDomain: "http://localhost:3000",
		apiBasePath: "/",
	},
	recipeList: [Session.init({})],
};

let sessionStorage: Record<string, InlangSessionCacheEntry>;

const supertokensEnabled = env.VITE_SUPERTOKENS_IN_DEV !== undefined;

export const initSession = () => {
	if (supertokensEnabled) {
		supertokens.init(config);
	} else {
		console.log(
			"Supertokens session disabled for the dev environment. Enable by setting the env var 'SUPERTOKENS_ENABLE' to 'true'"
		);
	}
};

// Doesn't support all of the supertokens session reciep features in dev environment
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

export const sessionMiddleware = () => {
	if (supertokensEnabled) {
		return [
			cors({
				origin: "http://localhost:300",
				allowedHeaders: ["content-type", ...supertokens.getAllCORSHeaders()],
				credentials: true,
			}),
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
