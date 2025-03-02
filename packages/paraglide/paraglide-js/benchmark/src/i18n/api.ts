import * as paraglide from "../paraglide/runtime.js";
import * as i18next from "./i18next.ts";

declare global {
	var setLocale: (locale: string) => void;
	var getLocale: () => string;
	var locales: string[];
}

globalThis.locales = paraglide.locales as any;

globalThis.setLocale = (locale: string) => {
	if (process.env.LIBRARY === "paraglide") {
		return paraglide.setLocale(locale as any);
	} else if (process.env.LIBRARY === "i18next") {
		return i18next.changeLanguage(locale);
	}
	throw new Error("Unsupported library");
};

globalThis.getLocale = () => {
	if (process.env.LIBRARY === "paraglide") {
		return paraglide.getLocale();
	} else if (process.env.LIBRARY === "i18next") {
		return "i18next has no API for getting the current locale";
	}
	throw new Error("Unsupported library");
};
