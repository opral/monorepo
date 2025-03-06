import * as i18next from "i18next";
import FsBackend from "i18next-fs-backend";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpApi from "i18next-http-backend";

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

export const importExpression = () => `import i18next from "i18next";`;

export const getLocale = () => {
	return new URL(window.location.href).searchParams.get("locale") || "en";
};

export const setLocale = (locale: string) => {
	i18next.changeLanguage(locale);
	const url = new URL(window.location.href);
	url.searchParams.set("locale", locale);
	window.location.href = url.toString();
};

export const init = async () => {
	if (process.env.IS_CLIENT) {
		// don't try to load the messages during ssg
		if (typeof window !== "undefined") {
			// Check for specific library modes
			if (process.env.LIBRARY_MODE === "http-backend") {
				// HTTP Backend mode
				await i18next
					.use(LanguageDetector)
					.use(HttpApi)
					.init({
						backend: {
							loadPath: `/${process.env.BUILD_NAME}/messages/{{lng}}.json`,
							load: "languageOnly",
						},
						lng: "en",
					});
			} else if (process.env.LIBRARY_MODE === "default") {
				// default to bundled mode as described in
				// https://www.i18next.com/overview/getting-started#basic-sample
				const jsonFiles: Record<string, { default: string }> = import.meta.glob(
					"../../messages/*.json",
					{
						eager: true,
						query: "?raw",
					}
				);

				const locales = Object.keys(jsonFiles).map((key) =>
					key.replace("../../messages/", "").replace(".json", "")
				);

				const resources = Object.fromEntries(
					locales.map((locale) => [
						locale,
						{
							translation: JSON.parse(
								jsonFiles[`../../messages/${locale}.json`].default
							),
						},
					])
				);
				// @ts-ignore - i18next type errors
				await i18next.init({
					lng: "en",
					resources,
				});
			} else {
				throw new Error(`Unknown library mode: ${process.env.LIBRARY_MODE}`);
			}
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

export const middleware = undefined;