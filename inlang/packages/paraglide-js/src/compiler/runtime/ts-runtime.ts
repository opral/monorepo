/**
 * The project's base locale.
 *
 * @example
 *   if (locale === baseLocale) {
 *     // do something
 *   }
 */
export const baseLocale = "<replace>";

/**
 * The project's locales that have been specified in the settings.
 *
 * @example
 *   if (availableLocales.includes(userSelectedLocale) === false) {
 *     throw new Error('Locale is not available');
 *   }
 */
export const availableLocales = ["<replace>"] as const;

/**
 * This is a default implementation that is almost always
 * overwritten by \`defineGetLocale()\` and \`defineSetLocale()\`.
 *
 */
let _locale: AvailableLocale = baseLocale;

/**
 * Define the \`getLocale()\` function.
 *
 * Use this function to define how the locale is resolved. For example,
 * you can resolve the locale from the browser's preferred language,
 * a cookie, env variable, or a user's preference.
 *
 * @example
 *   defineGetLocale(() => {
 *     // resolve the locale from a cookie. fallback to the base locale.
 *     return Cookies.get('locale') ?? baseLocale
 *   }
 *
 */
export const defineGetLocale: (fn: () => AvailableLocale) => void = (fn) => {
	getLocale = fn;
};

/**
 * Define the \`setLocale()\` function.
 *
 * Use this function to define how the locale is set. For example,
 * modify a cookie, env variable, or a user's preference.
 *
 * @example
 *   defineSetLocale((newLocale) => {
 *     // set the locale in a cookie
 *     return Cookies.set('locale', newLocale)
 *   });
 *
 */
export const defineSetLocale: (
	fn: (newLocale: AvailableLocale) => void
) => void = (fn) => {
	setLocale = fn;
};

/**
 * Get the current locale.
 *
 * @example
 *   if (getLocale() === 'de') {
 *     console.log('Germany 🇩🇪');
 *   } else if (getLocale() === 'nl') {
 *     console.log('Netherlands 🇳🇱');
 *   }
 *
 */
export let getLocale: () => AvailableLocale =
	/** default implementation likely overwritten by \`defineGetLocale()\` */ () =>
		_locale;

/**
 * Set the locale.
 *
 * @example
 *   setLocale('en');
 */
export let setLocale: (newLocale: AvailableLocale) => void = (newLocale) => {
	/** default implementation likely overwritten by \`defineSetLocale()\` */
	_locale = newLocale;
};

/**
 * Check if something is an available locale.
 *
 * @example
 *   if (isLocale(params.locale)) {
 *     setLocale(params.locale);
 *   } else {
 *     setLocale('en');
 *   }
 */
export function isAvailableLocale(locale: any): locale is AvailableLocale {
	return availableLocales.includes(locale);
}

// ------ TYPES ------

/**
 * A locale that is available in the project.
 *
 * @example
 *   setLocale(request.locale as AvailableLocale)
 *
 */
export type AvailableLocale = (typeof availableLocales)[number];
