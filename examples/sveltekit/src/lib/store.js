import { writable, get } from 'svelte/store';

// The i18n store serves as second possbility 
// to achieve i18n ROUTING. But tests where not successfull. 
function createI18nStore(){
    const { subscribe, set } = writable();
    return {
        subscribe,
        route: (href) => `/${get(i18n)}` + href,
        setLanguage: (lang) => set(lang)
    }
}

export const i18n = createI18nStore()