import * as i18next from "i18next";
import FsBackend from "i18next-fs-backend";

// need to re-export to make the init call work
export * as i18next from "i18next";

/**
 * Creates a reference to the message using i18next.
 *
 * @example
 *   refMessage("message", { id: "123" })
 *   -> t("message", { id: "123" })
 */
export const refMessage = (key: string, params: Record<string, string>) => {
	return `i18next.t("${key}", ${JSON.stringify(params)})`;
};

export const importExpression = () =>
	`import { i18next } from "<src>/i18n/i18next.ts";`;

export const init = async () => {
	if (process.env.IS_CLIENT) {
		// don't try to load the messages during ssg
		if (typeof window !== "undefined") {
			// @ts-ignore - dynamically generated
			const messages = await import("../../messages/en.json");
			await i18next.init({
				debug: true,
				lng: "en",
				resources: {
					en: {
						translation: messages,
					},
				},
			});
		}
	} else {
		await i18next.use(FsBackend).init({
			lng: "en",
			backend: {
				loadPath: "../../messages/{{lng}}.json",
			},
		});
		console.log("loaded");
	}
};
