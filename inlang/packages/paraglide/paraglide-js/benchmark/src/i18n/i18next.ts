import { init, t, changeLanguage } from "i18next";

export { t, changeLanguage };

/**
 * Creates a reference to the message using i18next.
 *
 * @example
 *   refMessage("message", { id: "123" })
 *   -> t("message", { id: "123" })
 */
export const refMessage = (key: string, params: Record<string, string>) => {
	return `t("${key}", ${JSON.stringify(params)})`;
};

export const importExpression = () =>
	`import { t } from "<src>/i18n/i18next.ts";`;

init({
	lng: "en",
	resources: {
		en: {
			translation: {
				message0: "msg000 from i18next",
				message1: "msg111 from i18next",
			},
		},
	},
});
