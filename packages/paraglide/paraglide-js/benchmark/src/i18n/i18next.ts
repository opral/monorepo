import * as i18next from "i18next";
import FsBackend from "i18next-fs-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpApi from "i18next-http-backend";

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
	return `i18next.t("${key}", ${params ? JSON.stringify(params) : ""})`;
};

export const importExpression = () =>
	`import { i18next } from "<src>/i18n/i18next.ts";`;

export const init = async () => {
	if (process.env.IS_CLIENT) {
		// don't try to load the messages during ssg
		if (typeof window !== "undefined") {
			await i18next
				.use(LanguageDetector)
				.use(HttpApi)
				.init({
					backend: {
						loadPath: "/messages/{{lng}}.json",
						load: "languageOnly",
					},
					lng: "en",
				});
		}
	} else {
		await i18next.use(FsBackend).init({
			lng: "en",
			backend: {
				loadPath: "../../messages/{{lng}}.json",
			},
		});
	}
};
