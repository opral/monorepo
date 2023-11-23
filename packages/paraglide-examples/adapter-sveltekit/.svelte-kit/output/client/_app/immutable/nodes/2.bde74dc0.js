import { s as safe_not_equal, n as noop, r as run_all } from "../chunks/scheduler.b51ce850.js";
import { S as SvelteComponent, i as init, g as element, m as text, s as space, h as claim_element, j as children, n as claim_text, f as detach, c as claim_space, y as get_svelte_dataset, a as insert_hydration, x as append_hydration, z as listen } from "../chunks/index.562a46f0.js";
import { l as languageTag, s as setLanguageTag } from "../chunks/runtime.04c82781.js";
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
function create_fragment(ctx) {
  let p0;
  let t0_value = greeting({ name: "Samuel", count: 5 }) + "";
  let t0;
  let t1;
  let p1;
  let t2_value = currentLanguageTag({ languageTag: languageTag() }) + "";
  let t2;
  let t3;
  let button0;
  let textContent = 'change language to "de"';
  let t5;
  let button1;
  let textContent_1 = 'change language to "en"';
  let mounted;
  let dispose;
  return {
    c() {
      p0 = element("p");
      t0 = text(t0_value);
      t1 = space();
      p1 = element("p");
      t2 = text(t2_value);
      t3 = space();
      button0 = element("button");
      button0.textContent = textContent;
      t5 = space();
      button1 = element("button");
      button1.textContent = textContent_1;
    },
    l(nodes) {
      p0 = claim_element(nodes, "P", {});
      var p0_nodes = children(p0);
      t0 = claim_text(p0_nodes, t0_value);
      p0_nodes.forEach(detach);
      t1 = claim_space(nodes);
      p1 = claim_element(nodes, "P", {});
      var p1_nodes = children(p1);
      t2 = claim_text(p1_nodes, t2_value);
      p1_nodes.forEach(detach);
      t3 = claim_space(nodes);
      button0 = claim_element(nodes, "BUTTON", { ["data-svelte-h"]: true });
      if (get_svelte_dataset(button0) !== "svelte-qvt88")
        button0.textContent = textContent;
      t5 = claim_space(nodes);
      button1 = claim_element(nodes, "BUTTON", { ["data-svelte-h"]: true });
      if (get_svelte_dataset(button1) !== "svelte-mqewtk")
        button1.textContent = textContent_1;
    },
    m(target, anchor) {
      insert_hydration(target, p0, anchor);
      append_hydration(p0, t0);
      insert_hydration(target, t1, anchor);
      insert_hydration(target, p1, anchor);
      append_hydration(p1, t2);
      insert_hydration(target, t3, anchor);
      insert_hydration(target, button0, anchor);
      insert_hydration(target, t5, anchor);
      insert_hydration(target, button1, anchor);
      if (!mounted) {
        dispose = [
          listen(
            button0,
            "click",
            /*click_handler*/
            ctx[0]
          ),
          listen(
            button1,
            "click",
            /*click_handler_1*/
            ctx[1]
          )
        ];
        mounted = true;
      }
    },
    p: noop,
    i: noop,
    o: noop,
    d(detaching) {
      if (detaching) {
        detach(p0);
        detach(t1);
        detach(p1);
        detach(t3);
        detach(button0);
        detach(t5);
        detach(button1);
      }
      mounted = false;
      run_all(dispose);
    }
  };
}
function instance($$self) {
  const click_handler = () => setLanguageTag("de");
  const click_handler_1 = () => setLanguageTag("en");
  return [click_handler, click_handler_1];
}
class Page extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance, create_fragment, safe_not_equal, {});
  }
}
export {
  Page as component
};
