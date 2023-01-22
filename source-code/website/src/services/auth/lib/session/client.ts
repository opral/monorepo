import SuperTokens from "supertokens-web-js";
import Session from "supertokens-web-js/recipe/session";
import { clientSideEnv } from "@env";
import type { SuperTokensConfig } from "supertokens-web-js/lib/build/types.js";
import { onSignOut } from "../../onSignOut.js";
import type { SetStoreFunction } from "solid-js/store";
import type { LocalStorageSchema } from "@src/services/local-storage/schema.js";
import { getLocalSessionCookie } from "./shared.js";
import { LOCAL_SESSION_COOKIE_NAME } from "./types.js";
import type { SetLocalStorage } from "@src/services/local-storage/LocalStorageProvider.jsx";

const supertokensEnabled = clientSideEnv.VITE_SUPERTOKENS_IN_DEV !== undefined;

interface ConfigArgs {
	setLocalStorage: SetLocalStorage;
}

const config: (args: ConfigArgs) => SuperTokensConfig = (args) => ({
	appInfo: {
		apiDomain: "http://localhost:3000",
		appName: clientSideEnv.VITE_SUPERTOKENS_APP_NAME ?? "inlang",
		apiBasePath: "/",
	},
	recipeList: [
		Session.init({
			override: {
				functions(originalImplementation, builder) {
					return {
						...originalImplementation,
						signOut(input) {
							onSignOut({
								setLocalStorage: args.setLocalStorage,
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
});

export const initClientSession = async (args: ConfigArgs) => {
	// init supertokens sesssion
	if (typeof window != "undefined" && clientSideEnv.VITE_SUPERTOKENS_IN_DEV) {
		SuperTokens.init(config(args));
		await Session.attemptRefreshingSession();
	}
};

export const tryCreateSession = async () => {
	await fetch("/services/auth/create-session", { method: "POST" });
};

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
