import { c as create_ssr_component, e as escape } from "../../../chunks/ssr.js";
import { l as languageTag } from "../../../chunks/runtime.js";
const currentLanguageTag$2 = (params) => {
  return `The current language tag is "${params.languageTag}".`;
};
const greeting$2 = (params) => {
  return `Welcome ${params.name}! You have ${params.count} messages.`;
};
const currentLanguageTag$1 = (params) => {
  return `Der aktuelle Sprachtag ist "${params.languageTag}".`;
};
const greeting$1 = (params) => {
  return `Hallo ${params.name}! Du hast ${params.count} Nachrichten.`;
};
const currentLanguageTag = (params) => {
  if (languageTag() === "de")
    return currentLanguageTag$1(params);
  if (languageTag() === "en")
    return currentLanguageTag$2(params);
  return void 0;
};
const greeting = (params) => {
  if (languageTag() === "de")
    return greeting$1(params);
  if (languageTag() === "en")
    return greeting$2(params);
  return void 0;
};
const Page = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `<p>${escape(greeting({ name: "Samuel", count: 5 }))}</p> <p>${escape(currentLanguageTag({ languageTag: languageTag() }))}</p> <button data-svelte-h="svelte-qvt88">change language to &quot;de&quot;</button> <button data-svelte-h="svelte-mqewtk">change language to &quot;en&quot;</button>`;
});
export {
  Page as default
};
