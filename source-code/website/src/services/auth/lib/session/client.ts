/**
 * Session logic for the frontend using supertokens for production and a simplified local version for simpler development.
 * Opt in to supertokens in development by setting the env variable 'VITE_SUPERTOKENS_IN_DEV' to 'true'.
 * Also check to set the other required env vars, which are listed in the development setup guid.
 * @see <ADD_URL>
 * @see https://supertokens.com/docs/session/introduction
 * @author Leo Grützner
 */

import SuperTokens from "supertokens-web-js";
import Session from "supertokens-web-js/recipe/session";
import { clientSideEnv } from "@env";
import { onSignOut } from "../../onSignOut.js";
import { getLocalSessionCookie } from "./shared.js";
import { LOCAL_SESSION_COOKIE_NAME } from "./types.js";
import { setLocalStorage } from "@src/services/local-storage/LocalStorageProvider.jsx";

const supertokensEnabled =
  clientSideEnv.NODE_ENV == "production" ||
  clientSideEnv.VITE_SUPERTOKENS_IN_DEV !== undefined;

const config = {
  appInfo: {
    apiDomain: clientSideEnv.VITE_FRONTEND_BASE_URL!,
    appName: clientSideEnv.VITE_SUPERTOKENS_APP_NAME ?? "inlang",
    apiBasePath: "/",
  },
  recipeList: [
    Session.init({
      override: {
        functions(originalImplementation) {
          return {
            ...originalImplementation,
            signOut(input) {
              onSignOut({
                // executing the correct sign out cleanup logic
                setLocalStorage: setLocalStorage,
                onlyClientSide: true,
              });
              return originalImplementation.signOut(input);
            },
          };
        },
      },
    }),
  ],
  enableDebugLogs: false,
};

/**
 * Initializes the inlang session logic on the client side. This must happen before any other session logic is used and before any API calls to backend routes that rely on the session logic are made.
 * For production, this initializes the supertokens session logic.
 * For development, this initializes the simplified local session logic.
 */
export const initClientSession = async () => {
  // init supertokens sesssion
  if (typeof window != "undefined" && clientSideEnv.VITE_SUPERTOKENS_IN_DEV) {
    SuperTokens.init(config);
    await Session.attemptRefreshingSession();
  }
};

/**
 * Calling the backend route to create a session.
 * This function has to be called before the Oauth flow is started!
 */
export const tryCreateSession = async () => {
  await fetch("/services/auth/create-session", { method: "POST" });
};

/**
 * Get the accessToken payload of the active session from the frontend.
 * @returns The accessToken payload or undefined if no session is active
 */
export const getAccessTokenPayload = async () => {
  if (supertokensEnabled) {
    try {
      return await Session.getAccessTokenPayloadSecurely();
    } catch {
      return undefined;
    }
  } else {
    return getLocalSessionCookie(
      document.cookie,
      LOCAL_SESSION_COOKIE_NAME.ACCESS_TOKEN_PAYLOAD
    );
  }
};
