import SuperTokens from "supertokens-web-js";
import Session from "supertokens-web-js/recipe/session";
import { clientSideEnv } from "@env";

export const initClientSession = () => {
	// init supertokens sesssion
	if (typeof window != "undefined" && clientSideEnv.VITE_SUPERTOKENS_IN_DEV) {
		console.log("init supertokens session", window.location.origin);

		SuperTokens.init({
			appInfo: {
				apiDomain: window.location.origin,
				appName: clientSideEnv.VITE_SUPERTOKENS_APP_NAME ?? "inlang",
				apiBasePath: "/session",
			},
			recipeList: [Session.init({})],
			enableDebugLogs: true,
		});
	}
};
