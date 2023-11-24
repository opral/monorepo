import { c as create_ssr_component, b as subscribe, a as setContext, g as getContext, v as validate_component } from "../../chunks/ssr.js";
import { s as setLanguageTag } from "../../chunks/runtime.js";
import { p as page } from "../../chunks/stores.js";
const ParaglideSvelteKit = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  let $page, $$unsubscribe_page;
  $$unsubscribe_page = subscribe(page, (value) => $page = value);
  setContext("languageTag", $page.params.lang);
  setLanguageTag(() => getContext("languageTag"));
  $$unsubscribe_page();
  return `${slots.default ? slots.default({}) : ``}`;
});
const Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
  return `${validate_component(ParaglideSvelteKit, "ParaglideJsSvelteKitAdapter").$$render($$result, {}, {}, {
    default: () => {
      return `${slots.default ? slots.default({}) : ``}`;
    }
  })}`;
});
export {
  Layout as default
};
