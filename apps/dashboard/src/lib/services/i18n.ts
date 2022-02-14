/**
 * Taken from https://github.com/inlang/awesome-fluent/tree/main/examples/svelte-kit
 */

import { FluentBundle, FluentResource } from '@fluent/bundle';
import type { Pattern } from '@fluent/bundle/esm/ast';
import Cookies from 'js-cookie';
import { derived, get, writable } from 'svelte/store';

/**
 * The paths to the resource (in the static directory).
 */
const resourcePaths = {
	de: '/translations/de.ftl',
	en: '/translations/en.ftl'
};

/**
 * Holds all available resources.
 *
 * Resources is initiliazed via the `loadResources`
 * function. Thus, don't forget to load the resources.
 */
const resources: Record<string, FluentResource> = {};

/**
 * The base language code acts as fallback in case a translation does not exist.
 *
 * The base language is the language used during development. In most cases it's
 * English.
 */
const baseLanguageCode = 'en';

/**
 * Gets the pattern of an id.
 *
 * The id can be a sole language id `hello`, or a combined
 * message/attribute id `hello.world`.
 */
function getPattern(id: string, bundle: FluentBundle): Pattern | undefined {
	if (id.includes('.')) {
		const message = bundle.getMessage(id.split('.')[0]);
		const attributePattern = message?.attributes[id.split('.')[1]];
		return attributePattern;
	} else {
		const message = bundle.getMessage(id);
		// pattern can be null, want to avoid using null thus if null -> undefined
		const messagePattern = message?.value ?? undefined;
		return messagePattern;
	}
}

/**
 * Formats the pattern of a `Message` or an `Attribute`.
 *
 */
function format(
	id: string,
	args?: Record<string, string> | null,
	errors?: Array<Error> | null
): string {
	const _locale = get(locale);
	const bundle = new FluentBundle([_locale]);
	bundle.addResource(resources[_locale]);
	const pattern = getPattern(id, bundle);
	if (pattern === undefined) {
		console.error(`Message with id "${id}" does not exist for language code "${_locale}".`);
		bundle.addResource(resources[baseLanguageCode]);
		const fallbackPattern = getPattern(id, bundle);
		if (fallbackPattern) {
			console.info('Using fallback pattern.');
			return bundle.formatPattern(fallbackPattern, args, errors);
		} else {
			console.error(`No fallback exists. Are you sure that the id "${id}" exists?`);
			return id;
		}
	}
	return bundle.formatPattern(pattern, args, errors);
}

/**
 * Load the resources from the static directory.
 *
 * Takes sveltekit's load function fetch implementation as argument,
 * otherwise the relative paths can not be resolved.
 * Read more here https://kit.svelte.dev/docs#loading-input-fetch
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadResources(args: { fetch: any }): Promise<void> {
	for (const [languageCode, path] of Object.entries(resourcePaths)) {
		try {
			const response = await args.fetch(path);
			if (response.ok === false) {
				throw Error(`Couldnt load the resource "${languageCode}" from path "${path}".`);
			}
			resources[languageCode] = new FluentResource(await response.text());
		} catch (error) {
			console.error(error);
		}
	}
}

/**
 * Store with the current locale the users visits the site in.
 *
 * Is initialized with the locale from the `locale` cookie.
 */
// The locale cookie is initilaized in the `hooks.ts`
export const locale = writable(Cookies.get('locale') ?? baseLanguageCode);

/**
 * Each time the locale changes, the locale cookie value is set.
 *
 * It is assumed that the locale is only explicitly changed when the user
 * changes his prefference.
 */
locale.subscribe((value) => {
	Cookies.set('locale', value, { expires: 365 });
});

/**
 * Translation function which automatically "rebuilds" if the locale changes.
 *
 * @example
 *
 */
export const t = derived(locale, () => format);
