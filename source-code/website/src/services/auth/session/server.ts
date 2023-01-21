import { verifySession } from "supertokens-node/recipe/session/framework/express/index.js";
import type { Request, Response, NextFunction } from "express";
import { middleware as supertokensMiddleware } from "supertokens-node/framework/express/index.js";
import type { SessionContainerInterface } from "supertokens-node/lib/build/recipe/session/types.js";
import cookie from "cookie";
import Session from "supertokens-node/recipe/session";
import crypto from "crypto";
import { serverSideEnv } from "@env";
import supertokens from "supertokens-node";
import { errorHandler as supertokensErrorHandler } from "supertokens-node/framework/express";
import cors from "cors";

const env = await serverSideEnv();

const COOKIE_SESSION_NAME = "inlang-dev-session";

export interface InlangSessionRequest extends Request {
	session?: InlangSession;
}

export type InlangSessionMiddleware = (
	req: InlangSessionRequest,
	res: Response<any, Record<string, any>>,
	next: NextFunction
) => Promise<void>;

export type InlangSession = Pick<
	SessionContainerInterface,
	"getSessionData" | "updateSessionData" | "revokeSession" | "getHandle"
>;

export type InlangSessionCacheEntry = {
	handle: string;
	userId: string;
	data: any;
};

let sessionStorage: Record<string, InlangSessionCacheEntry>;

export const supertokensEnabled = env.VITE_SUPERTOKENS_IN_DEV !== undefined;

export const initSession = () => {
	if (supertokensEnabled) {
		console.log("init supertokens session");
		supertokens.init({
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
				apiBasePath: "/session",
			},
			recipeList: [Session.init()],
		});
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
			const cookies = cookie.parse(req.headers.cookie || "");
			const handle = cookies[COOKIE_SESSION_NAME];

			console.log("handle", handle, req.headers.cookie);

			if (handle) {
				req.session = getLocalSession(res, handle);
			} else {
				setLocalSessionCookieHeader(res, "/session");
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

export const createSession = (res: Response, userId: string) => {
	if (supertokensEnabled) {
		return Session.createNewSession(res, userId);
	} else {
		return createLocalSession(res, userId);
	}
};

const createLocalSession = (res: Response, userId: string): InlangSession => {
	const handle = createCacheSession(userId);
	setLocalSessionCookieHeader(res, handle);

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
			console.log("revoking session");
			delete sessionStorage[handle];
		},
		getHandle: () => handle,
	};

	return session;
};

const createCacheSession = (userId: string) => {
	const sessionEntry: InlangSessionCacheEntry = {
		handle: crypto.randomBytes(20).toString("hex"),
		userId,
		data: {},
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

const setLocalSessionCookieHeader = (res: Response, value: string) => {
	console.log("setLocalSessionCookieHeader", value);

	res.setHeader(
		"Set-Cookie",
		cookie.serialize(COOKIE_SESSION_NAME, value, {
			httpOnly: true,
			path: "/",
		})
	);
};
