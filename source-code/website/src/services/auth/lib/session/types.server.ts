/**
 * Types for the session logic for the backend using supertokens for production and a simplified local version for simpler development.
 * @see <ADD_URL>
 * @see https://supertokens.com/docs/session/introduction
 * @author Leo Grützner
 */

import type { Request, Response, NextFunction } from "express";
import type { SessionContainerInterface } from "supertokens-node/lib/build/recipe/session/types.js";

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
  | "getSessionData"
  | "updateSessionData"
  | "revokeSession"
  | "getHandle"
  | "updateAccessTokenPayload"
>;

export type InlangSessionCacheEntry = {
  handle: string;
  userId: string;
  data: any;
};
