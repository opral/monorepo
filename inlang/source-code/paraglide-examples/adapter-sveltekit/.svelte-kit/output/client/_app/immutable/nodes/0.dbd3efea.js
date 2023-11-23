import { s as safe_not_equal, c as create_slot, u as update_slot_base, g as get_all_dirty_from_scope, d as get_slot_changes, e as component_subscribe, f as setContext, h as getContext } from "../chunks/scheduler.b51ce850.js";
import { S as SvelteComponent, i as init, d as transition_in, t as transition_out, r as create_component, u as claim_component, v as mount_component, w as destroy_component } from "../chunks/index.562a46f0.js";
import { s as setLanguageTag, o as onSetLanguageTag } from "../chunks/runtime.04c82781.js";
import { p as page } from "../chunks/stores.afe7c894.js";
function create_fragment$1(ctx) {
  let current;
  const default_slot_template = (
    /*#slots*/
    ctx[1].default
  );
  const default_slot = create_slot(
    default_slot_template,
    ctx,
    /*$$scope*/
    ctx[0],
    null
  );
  return {
    c() {
      if (default_slot)
        default_slot.c();
    },
    l(nodes) {
      if (default_slot)
        default_slot.l(nodes);
    },
    m(target, anchor) {
      if (default_slot) {
        default_slot.m(target, anchor);
      }
      current = true;
    },
    p(ctx2, [dirty]) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/
        1)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx2,
            /*$$scope*/
            ctx2[0],
            !current ? get_all_dirty_from_scope(
              /*$$scope*/
              ctx2[0]
            ) : get_slot_changes(
              default_slot_template,
              /*$$scope*/
              ctx2[0],
              dirty,
              null
            ),
            null
          );
        }
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (default_slot)
        default_slot.d(detaching);
    }
  };
}
function instance$1($$self, $$props, $$invalidate) {
  let $page;
  component_subscribe($$self, page, ($$value) => $$invalidate(2, $page = $$value));
  let { $$slots: slots = {}, $$scope } = $$props;
  setContext("languageTag", $page.params.lang);
  setLanguageTag(() => getContext("languageTag"));
  {
    onSetLanguageTag((newLanguageTag) => {
      window.location.href = `/${newLanguageTag}`;
    });
  }
  $$self.$$set = ($$props2) => {
    if ("$$scope" in $$props2)
      $$invalidate(0, $$scope = $$props2.$$scope);
  };
  return [$$scope, slots];
}
class ParaglideSvelteKit extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$1, create_fragment$1, safe_not_equal, {});
  }
}
function create_default_slot(ctx) {
  let current;
  const default_slot_template = (
    /*#slots*/
    ctx[0].default
  );
  const default_slot = create_slot(
    default_slot_template,
    ctx,
    /*$$scope*/
    ctx[1],
    null
  );
  return {
    c() {
      if (default_slot)
        default_slot.c();
    },
    l(nodes) {
      if (default_slot)
        default_slot.l(nodes);
    },
    m(target, anchor) {
      if (default_slot) {
        default_slot.m(target, anchor);
      }
      current = true;
    },
    p(ctx2, dirty) {
      if (default_slot) {
        if (default_slot.p && (!current || dirty & /*$$scope*/
        2)) {
          update_slot_base(
            default_slot,
            default_slot_template,
            ctx2,
            /*$$scope*/
            ctx2[1],
            !current ? get_all_dirty_from_scope(
              /*$$scope*/
              ctx2[1]
            ) : get_slot_changes(
              default_slot_template,
              /*$$scope*/
              ctx2[1],
              dirty,
              null
            ),
            null
          );
        }
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      current = false;
    },
    d(detaching) {
      if (default_slot)
        default_slot.d(detaching);
    }
  };
}
function create_fragment(ctx) {
  let paraglidejssveltekitadapter;
  let current;
  paraglidejssveltekitadapter = new ParaglideSvelteKit({
    props: {
      $$slots: { default: [create_default_slot] },
      $$scope: { ctx }
    }
  });
  return {
    c() {
      create_component(paraglidejssveltekitadapter.$$.fragment);
    },
    l(nodes) {
      claim_component(paraglidejssveltekitadapter.$$.fragment, nodes);
    },
    m(target, anchor) {
      mount_component(paraglidejssveltekitadapter, target, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      const paraglidejssveltekitadapter_changes = {};
      if (dirty & /*$$scope*/
      2) {
        paraglidejssveltekitadapter_changes.$$scope = { dirty, ctx: ctx2 };
      }
      paraglidejssveltekitadapter.$set(paraglidejssveltekitadapter_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(paraglidejssveltekitadapter.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(paraglidejssveltekitadapter.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      destroy_component(paraglidejssveltekitadapter, detaching);
    }
  };
}
function instance($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  $$self.$$set = ($$props2) => {
    if ("$$scope" in $$props2)
      $$invalidate(1, $$scope = $$props2.$$scope);
  };
  return [slots, $$scope];
}
class Layout extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance, create_fragment, safe_not_equal, {});
  }
}
export {
  Layout as component
};
