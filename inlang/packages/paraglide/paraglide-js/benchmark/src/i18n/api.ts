import * as paraglide from "../paraglide/runtime.js";

declare global {
	var setLocale: (locale: string) => void;
	var getLocale: () => string;
	var locales: string[];
}

globalThis.locales = paraglide.locales as any;

globalThis.setLocale = (locale: string) => {
	if (process.env.LIBRARY === "paraglide") {
		paraglide.setLocale(locale as any);
	}
	throw new Error("Unsupported library");
};

globalThis.getLocale = () => {
	if (process.env.LIBRARY === "paraglide") {
		return paraglide.getLocale();
	}
	throw new Error("Unsupported library");
};
