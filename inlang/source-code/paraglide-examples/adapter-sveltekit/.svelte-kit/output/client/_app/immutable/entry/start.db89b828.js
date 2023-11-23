import { o as onMount, t as tick } from "../chunks/scheduler.b51ce850.js";
import { S as SCROLL_KEY, a as SNAPSHOT_KEY, I as INDEX_KEY, g as get_base_uri, f as find_anchor, b as get_link_info, c as get_router_options, s as scroll_state, i as is_external_url, d as stores, o as origin, e as base, P as PRELOAD_PRIORITIES, h as init } from "../chunks/singletons.1cd9a504.js";
function normalize_path(path, trailing_slash) {
  if (path === "/" || trailing_slash === "ignore")
    return path;
  if (trailing_slash === "never") {
    return path.endsWith("/") ? path.slice(0, -1) : path;
  } else if (trailing_slash === "always" && !path.endsWith("/")) {
    return path + "/";
  }
  return path;
}
function decode_pathname(pathname) {
  return pathname.split("%25").map(decodeURI).join("%25");
}
function decode_params(params) {
  for (const key in params) {
    params[key] = decodeURIComponent(params[key]);
  }
  return params;
}
const tracked_url_properties = (
  /** @type {const} */
  [
    "href",
    "pathname",
    "search",
    "searchParams",
    "toString",
    "toJSON"
  ]
);
function make_trackable(url, callback) {
  const tracked = new URL(url);
  for (const property of tracked_url_properties) {
    Object.defineProperty(tracked, property, {
      get() {
        callback();
        return url[property];
      },
      enumerable: true,
      configurable: true
    });
  }
  disable_hash(tracked);
  return tracked;
}
function disable_hash(url) {
  Object.defineProperty(url, "hash", {
    get() {
      throw new Error(
        "Cannot access event.url.hash. Consider using `$page.url.hash` inside a component instead"
      );
    }
  });
}
const DATA_SUFFIX = "/__data.json";
function add_data_suffix(pathname) {
  return pathname.replace(/\/$/, "") + DATA_SUFFIX;
}
function hash(...values) {
  let hash2 = 5381;
  for (const value of values) {
    if (typeof value === "string") {
      let i = value.length;
      while (i)
        hash2 = hash2 * 33 ^ value.charCodeAt(--i);
    } else if (ArrayBuffer.isView(value)) {
      const buffer = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      let i = buffer.length;
      while (i)
        hash2 = hash2 * 33 ^ buffer[--i];
    } else {
      throw new TypeError("value must be a string or TypedArray");
    }
  }
  return (hash2 >>> 0).toString(36);
}
const native_fetch = window.fetch;
{
  window.fetch = (input, init2) => {
    const method = input instanceof Request ? input.method : (init2 == null ? void 0 : init2.method) || "GET";
    if (method !== "GET") {
      cache.delete(build_selector(input));
    }
    return native_fetch(input, init2);
  };
}
const cache = /* @__PURE__ */ new Map();
function initial_fetch(resource, opts) {
  const selector = build_selector(resource, opts);
  const script = document.querySelector(selector);
  if (script == null ? void 0 : script.textContent) {
    const { body, ...init2 } = JSON.parse(script.textContent);
    const ttl = script.getAttribute("data-ttl");
    if (ttl)
      cache.set(selector, { body, init: init2, ttl: 1e3 * Number(ttl) });
    return Promise.resolve(new Response(body, init2));
  }
  return window.fetch(resource, opts);
}
function subsequent_fetch(resource, resolved, opts) {
  if (cache.size > 0) {
    const selector = build_selector(resource, opts);
    const cached = cache.get(selector);
    if (cached) {
      if (performance.now() < cached.ttl && ["default", "force-cache", "only-if-cached", void 0].includes(opts == null ? void 0 : opts.cache)) {
        return new Response(cached.body, cached.init);
      }
      cache.delete(selector);
    }
  }
  return window.fetch(resolved, opts);
}
function build_selector(resource, opts) {
  const url = JSON.stringify(resource instanceof Request ? resource.url : resource);
  let selector = `script[data-sveltekit-fetched][data-url=${url}]`;
  if ((opts == null ? void 0 : opts.headers) || (opts == null ? void 0 : opts.body)) {
    const values = [];
    if (opts.headers) {
      values.push([...new Headers(opts.headers)].join(","));
    }
    if (opts.body && (typeof opts.body === "string" || ArrayBuffer.isView(opts.body))) {
      values.push(opts.body);
    }
    selector += `[data-hash="${hash(...values)}"]`;
  }
  return selector;
}
const param_pattern = /^(\[)?(\.\.\.)?(\w+)(?:=(\w+))?(\])?$/;
function parse_route_id(id) {
  const params = [];
  const pattern = id === "/" ? /^\/$/ : new RegExp(
    `^${get_route_segments(id).map((segment) => {
      const rest_match = /^\[\.\.\.(\w+)(?:=(\w+))?\]$/.exec(segment);
      if (rest_match) {
        params.push({
          name: rest_match[1],
          matcher: rest_match[2],
          optional: false,
          rest: true,
          chained: true
        });
        return "(?:/(.*))?";
      }
      const optional_match = /^\[\[(\w+)(?:=(\w+))?\]\]$/.exec(segment);
      if (optional_match) {
        params.push({
          name: optional_match[1],
          matcher: optional_match[2],
          optional: true,
          rest: false,
          chained: true
        });
        return "(?:/([^/]+))?";
      }
      if (!segment) {
        return;
      }
      const parts = segment.split(/\[(.+?)\](?!\])/);
      const result = parts.map((content, i) => {
        if (i % 2) {
          if (content.startsWith("x+")) {
            return escape(String.fromCharCode(parseInt(content.slice(2), 16)));
          }
          if (content.startsWith("u+")) {
            return escape(
              String.fromCharCode(
                ...content.slice(2).split("-").map((code) => parseInt(code, 16))
              )
            );
          }
          const match = param_pattern.exec(content);
          if (!match) {
            throw new Error(
              `Invalid param: ${content}. Params and matcher names can only have underscores and alphanumeric characters.`
            );
          }
          const [, is_optional, is_rest, name, matcher] = match;
          params.push({
            name,
            matcher,
            optional: !!is_optional,
            rest: !!is_rest,
            chained: is_rest ? i === 1 && parts[0] === "" : false
          });
          return is_rest ? "(.*?)" : is_optional ? "([^/]*)?" : "([^/]+?)";
        }
        return escape(content);
      }).join("");
      return "/" + result;
    }).join("")}/?$`
  );
  return { pattern, params };
}
function affects_path(segment) {
  return !/^\([^)]+\)$/.test(segment);
}
function get_route_segments(route) {
  return route.slice(1).split("/").filter(affects_path);
}
function exec(match, params, matchers) {
  const result = {};
  const values = match.slice(1);
  const values_needing_match = values.filter((value) => value !== void 0);
  let buffered = 0;
  for (let i = 0; i < params.length; i += 1) {
    const param = params[i];
    let value = values[i - buffered];
    if (param.chained && param.rest && buffered) {
      value = values.slice(i - buffered, i + 1).filter((s) => s).join("/");
      buffered = 0;
    }
    if (value === void 0) {
      if (param.rest)
        result[param.name] = "";
      continue;
    }
    if (!param.matcher || matchers[param.matcher](value)) {
      result[param.name] = value;
      const next_param = params[i + 1];
      const next_value = values[i + 1];
      if (next_param && !next_param.rest && next_param.optional && next_value && param.chained) {
        buffered = 0;
      }
      if (!next_param && !next_value && Object.keys(result).length === values_needing_match.length) {
        buffered = 0;
      }
      continue;
    }
    if (param.optional && param.chained) {
      buffered++;
      continue;
    }
    return;
  }
  if (buffered)
    return;
  return result;
}
function escape(str) {
  return str.normalize().replace(/[[\]]/g, "\\$&").replace(/%/g, "%25").replace(/\//g, "%2[Ff]").replace(/\?/g, "%3[Ff]").replace(/#/g, "%23").replace(/[.*+?^${}()|\\]/g, "\\$&");
}
function parse({ nodes, server_loads, dictionary, matchers }) {
  const layouts_with_server_load = new Set(server_loads);
  return Object.entries(dictionary).map(([id, [leaf, layouts, errors]]) => {
    const { pattern, params } = parse_route_id(id);
    const route = {
      id,
      /** @param {string} path */
      exec: (path) => {
        const match = pattern.exec(path);
        if (match)
          return exec(match, params, matchers);
      },
      errors: [1, ...errors || []].map((n) => nodes[n]),
      layouts: [0, ...layouts || []].map(create_layout_loader),
      leaf: create_leaf_loader(leaf)
    };
    route.errors.length = route.layouts.length = Math.max(
      route.errors.length,
      route.layouts.length
    );
    return route;
  });
  function create_leaf_loader(id) {
    const uses_server_data = id < 0;
    if (uses_server_data)
      id = ~id;
    return [uses_server_data, nodes[id]];
  }
  function create_layout_loader(id) {
    return id === void 0 ? id : [layouts_with_server_load.has(id), nodes[id]];
  }
}
function get(key) {
  try {
    return JSON.parse(sessionStorage[key]);
  } catch {
  }
}
function set(key, value) {
  const json = JSON.stringify(value);
  try {
    sessionStorage[key] = json;
  } catch {
  }
}
const UNDEFINED = -1;
const HOLE = -2;
const NAN = -3;
const POSITIVE_INFINITY = -4;
const NEGATIVE_INFINITY = -5;
const NEGATIVE_ZERO = -6;
function unflatten(parsed, revivers) {
  if (typeof parsed === "number")
    return hydrate(parsed, true);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Invalid input");
  }
  const values = (
    /** @type {any[]} */
    parsed
  );
  const hydrated = Array(values.length);
  function hydrate(index, standalone = false) {
    if (index === UNDEFINED)
      return void 0;
    if (index === NAN)
      return NaN;
    if (index === POSITIVE_INFINITY)
      return Infinity;
    if (index === NEGATIVE_INFINITY)
      return -Infinity;
    if (index === NEGATIVE_ZERO)
      return -0;
    if (standalone)
      throw new Error(`Invalid input`);
    if (index in hydrated)
      return hydrated[index];
    const value = values[index];
    if (!value || typeof value !== "object") {
      hydrated[index] = value;
    } else if (Array.isArray(value)) {
      if (typeof value[0] === "string") {
        const type = value[0];
        const reviver = revivers == null ? void 0 : revivers[type];
        if (reviver) {
          return hydrated[index] = reviver(hydrate(value[1]));
        }
        switch (type) {
          case "Date":
            hydrated[index] = new Date(value[1]);
            break;
          case "Set":
            const set2 = /* @__PURE__ */ new Set();
            hydrated[index] = set2;
            for (let i = 1; i < value.length; i += 1) {
              set2.add(hydrate(value[i]));
            }
            break;
          case "Map":
            const map = /* @__PURE__ */ new Map();
            hydrated[index] = map;
            for (let i = 1; i < value.length; i += 2) {
              map.set(hydrate(value[i]), hydrate(value[i + 1]));
            }
            break;
          case "RegExp":
            hydrated[index] = new RegExp(value[1], value[2]);
            break;
          case "Object":
            hydrated[index] = Object(value[1]);
            break;
          case "BigInt":
            hydrated[index] = BigInt(value[1]);
            break;
          case "null":
            const obj = /* @__PURE__ */ Object.create(null);
            hydrated[index] = obj;
            for (let i = 1; i < value.length; i += 2) {
              obj[value[i]] = hydrate(value[i + 1]);
            }
            break;
          default:
            throw new Error(`Unknown type ${type}`);
        }
      } else {
        const array = new Array(value.length);
        hydrated[index] = array;
        for (let i = 0; i < value.length; i += 1) {
          const n = value[i];
          if (n === HOLE)
            continue;
          array[i] = hydrate(n);
        }
      }
    } else {
      const object = {};
      hydrated[index] = object;
      for (const key in value) {
        const n = value[key];
        object[key] = hydrate(n);
      }
    }
    return hydrated[index];
  }
  return hydrate(0);
}
function compact(arr) {
  return arr.filter(
    /** @returns {val is NonNullable<T>} */
    (val) => val != null
  );
}
const valid_layout_exports = /* @__PURE__ */ new Set([
  "load",
  "prerender",
  "csr",
  "ssr",
  "trailingSlash",
  "config"
]);
/* @__PURE__ */ new Set([...valid_layout_exports, "entries"]);
const valid_layout_server_exports = /* @__PURE__ */ new Set([...valid_layout_exports]);
/* @__PURE__ */ new Set([...valid_layout_server_exports, "actions", "entries"]);
async function unwrap_promises(object) {
  var _a;
  for (const key in object) {
    if (typeof ((_a = object[key]) == null ? void 0 : _a.then) === "function") {
      return Object.fromEntries(
        await Promise.all(Object.entries(object).map(async ([key2, value]) => [key2, await value]))
      );
    }
  }
  return object;
}
class HttpError {
  /**
   * @param {number} status
   * @param {{message: string} extends App.Error ? (App.Error | string | undefined) : App.Error} body
   */
  constructor(status, body) {
    this.status = status;
    if (typeof body === "string") {
      this.body = { message: body };
    } else if (body) {
      this.body = body;
    } else {
      this.body = { message: `Error: ${status}` };
    }
  }
  toString() {
    return JSON.stringify(this.body);
  }
}
class Redirect {
  /**
   * @param {300 | 301 | 302 | 303 | 304 | 305 | 306 | 307 | 308} status
   * @param {string} location
   */
  constructor(status, location2) {
    this.status = status;
    this.location = location2;
  }
}
const INVALIDATED_PARAM = "x-sveltekit-invalidated";
const TRAILING_SLASH_PARAM = "x-sveltekit-trailing-slash";
const scroll_positions = get(SCROLL_KEY) ?? {};
const snapshots = get(SNAPSHOT_KEY) ?? {};
function update_scroll_positions(index) {
  scroll_positions[index] = scroll_state();
}
function native_navigation(url) {
  location.href = url.href;
  return new Promise(() => {
  });
}
function create_client(app, target) {
  var _a;
  const routes = parse(app);
  const default_layout_loader = app.nodes[0];
  const default_error_loader = app.nodes[1];
  default_layout_loader();
  default_error_loader();
  const container = document.documentElement;
  const invalidated = [];
  const components = [];
  let load_cache = null;
  const callbacks = {
    /** @type {Array<(navigation: import('@sveltejs/kit').BeforeNavigate) => void>} */
    before_navigate: [],
    /** @type {Array<(navigation: import('@sveltejs/kit').OnNavigate) => import('types').MaybePromise<(() => void) | void>>} */
    on_navigate: [],
    /** @type {Array<(navigation: import('@sveltejs/kit').AfterNavigate) => void>} */
    after_navigate: []
  };
  let current = {
    branch: [],
    error: null,
    // @ts-ignore - we need the initial value to be null
    url: null
  };
  let hydrated = false;
  let started = false;
  let autoscroll = true;
  let updating = false;
  let navigating = false;
  let hash_navigating = false;
  let force_invalidation = false;
  let root;
  let current_history_index = (_a = history.state) == null ? void 0 : _a[INDEX_KEY];
  if (!current_history_index) {
    current_history_index = Date.now();
    history.replaceState(
      { ...history.state, [INDEX_KEY]: current_history_index },
      "",
      location.href
    );
  }
  const scroll = scroll_positions[current_history_index];
  if (scroll) {
    history.scrollRestoration = "manual";
    scrollTo(scroll.x, scroll.y);
  }
  let page;
  let token;
  let pending_invalidate;
  async function invalidate() {
    pending_invalidate = pending_invalidate || Promise.resolve();
    await pending_invalidate;
    if (!pending_invalidate)
      return;
    pending_invalidate = null;
    const url = new URL(location.href);
    const intent = get_navigation_intent(url, true);
    load_cache = null;
    const nav_token = token = {};
    const navigation_result = intent && await load_route(intent);
    if (nav_token !== token)
      return;
    if (navigation_result) {
      if (navigation_result.type === "redirect") {
        return goto(new URL(navigation_result.location, url).href, {}, 1, nav_token);
      } else {
        if (navigation_result.props.page !== void 0) {
          page = navigation_result.props.page;
        }
        root.$set(navigation_result.props);
      }
    }
  }
  function capture_snapshot(index) {
    if (components.some((c) => c == null ? void 0 : c.snapshot)) {
      snapshots[index] = components.map((c) => {
        var _a2;
        return (_a2 = c == null ? void 0 : c.snapshot) == null ? void 0 : _a2.capture();
      });
    }
  }
  function restore_snapshot(index) {
    var _a2;
    (_a2 = snapshots[index]) == null ? void 0 : _a2.forEach((value, i) => {
      var _a3, _b;
      (_b = (_a3 = components[i]) == null ? void 0 : _a3.snapshot) == null ? void 0 : _b.restore(value);
    });
  }
  function persist_state() {
    update_scroll_positions(current_history_index);
    set(SCROLL_KEY, scroll_positions);
    capture_snapshot(current_history_index);
    set(SNAPSHOT_KEY, snapshots);
  }
  async function goto(url, {
    noScroll = false,
    replaceState = false,
    keepFocus = false,
    state = {},
    invalidateAll = false
  }, redirect_count, nav_token) {
    if (typeof url === "string") {
      url = new URL(url, get_base_uri(document));
    }
    return navigate({
      url,
      scroll: noScroll ? scroll_state() : null,
      keepfocus: keepFocus,
      redirect_count,
      details: {
        state,
        replaceState
      },
      nav_token,
      accepted: () => {
        if (invalidateAll) {
          force_invalidation = true;
        }
      },
      blocked: () => {
      },
      type: "goto"
    });
  }
  async function preload_data(intent) {
    load_cache = {
      id: intent.id,
      promise: load_route(intent).then((result) => {
        if (result.type === "loaded" && result.state.error) {
          load_cache = null;
        }
        return result;
      })
    };
    return load_cache.promise;
  }
  async function preload_code(...pathnames) {
    const matching = routes.filter((route) => pathnames.some((pathname) => route.exec(pathname)));
    const promises = matching.map((r) => {
      return Promise.all([...r.layouts, r.leaf].map((load) => load == null ? void 0 : load[1]()));
    });
    await Promise.all(promises);
  }
  function initialize(result) {
    var _a2;
    current = result.state;
    const style = document.querySelector("style[data-sveltekit]");
    if (style)
      style.remove();
    page = /** @type {import('@sveltejs/kit').Page} */
    result.props.page;
    root = new app.root({
      target,
      props: { ...result.props, stores, components },
      hydrate: true
    });
    restore_snapshot(current_history_index);
    const navigation = {
      from: null,
      to: {
        params: current.params,
        route: { id: ((_a2 = current.route) == null ? void 0 : _a2.id) ?? null },
        url: new URL(location.href)
      },
      willUnload: false,
      type: "enter",
      complete: Promise.resolve()
    };
    callbacks.after_navigate.forEach((fn) => fn(navigation));
    started = true;
  }
  async function get_navigation_result_from_branch({
    url,
    params,
    branch,
    status,
    error,
    route,
    form
  }) {
    let slash = "never";
    for (const node of branch) {
      if ((node == null ? void 0 : node.slash) !== void 0)
        slash = node.slash;
    }
    url.pathname = normalize_path(url.pathname, slash);
    url.search = url.search;
    const result = {
      type: "loaded",
      state: {
        url,
        params,
        branch,
        error,
        route
      },
      props: {
        // @ts-ignore Somehow it's getting SvelteComponent and SvelteComponentDev mixed up
        constructors: compact(branch).map((branch_node) => branch_node.node.component)
      }
    };
    if (form !== void 0) {
      result.props.form = form;
    }
    let data = {};
    let data_changed = !page;
    let p = 0;
    for (let i = 0; i < Math.max(branch.length, current.branch.length); i += 1) {
      const node = branch[i];
      const prev = current.branch[i];
      if ((node == null ? void 0 : node.data) !== (prev == null ? void 0 : prev.data))
        data_changed = true;
      if (!node)
        continue;
      data = { ...data, ...node.data };
      if (data_changed) {
        result.props[`data_${p}`] = data;
      }
      p += 1;
    }
    const page_changed = !current.url || url.href !== current.url.href || current.error !== error || form !== void 0 && form !== page.form || data_changed;
    if (page_changed) {
      result.props.page = {
        error,
        params,
        route: {
          id: (route == null ? void 0 : route.id) ?? null
        },
        status,
        url: new URL(url),
        form: form ?? null,
        // The whole page store is updated, but this way the object reference stays the same
        data: data_changed ? data : page.data
      };
    }
    return result;
  }
  async function load_node({ loader, parent, url, params, route, server_data_node }) {
    var _a2, _b, _c;
    let data = null;
    const uses = {
      dependencies: /* @__PURE__ */ new Set(),
      params: /* @__PURE__ */ new Set(),
      parent: false,
      route: false,
      url: false
    };
    const node = await loader();
    if ((_a2 = node.universal) == null ? void 0 : _a2.load) {
      let depends = function(...deps) {
        for (const dep of deps) {
          const { href } = new URL(dep, url);
          uses.dependencies.add(href);
        }
      };
      const load_input = {
        route: new Proxy(route, {
          get: (target2, key) => {
            uses.route = true;
            return target2[
              /** @type {'id'} */
              key
            ];
          }
        }),
        params: new Proxy(params, {
          get: (target2, key) => {
            uses.params.add(
              /** @type {string} */
              key
            );
            return target2[
              /** @type {string} */
              key
            ];
          }
        }),
        data: (server_data_node == null ? void 0 : server_data_node.data) ?? null,
        url: make_trackable(url, () => {
          uses.url = true;
        }),
        async fetch(resource, init2) {
          let requested;
          if (resource instanceof Request) {
            requested = resource.url;
            init2 = {
              // the request body must be consumed in memory until browsers
              // implement streaming request bodies and/or the body getter
              body: resource.method === "GET" || resource.method === "HEAD" ? void 0 : await resource.blob(),
              cache: resource.cache,
              credentials: resource.credentials,
              headers: resource.headers,
              integrity: resource.integrity,
              keepalive: resource.keepalive,
              method: resource.method,
              mode: resource.mode,
              redirect: resource.redirect,
              referrer: resource.referrer,
              referrerPolicy: resource.referrerPolicy,
              signal: resource.signal,
              ...init2
            };
          } else {
            requested = resource;
          }
          const resolved = new URL(requested, url);
          depends(resolved.href);
          if (resolved.origin === url.origin) {
            requested = resolved.href.slice(url.origin.length);
          }
          return started ? subsequent_fetch(requested, resolved.href, init2) : initial_fetch(requested, init2);
        },
        setHeaders: () => {
        },
        // noop
        depends,
        parent() {
          uses.parent = true;
          return parent();
        }
      };
      {
        data = await node.universal.load.call(null, load_input) ?? null;
      }
      data = data ? await unwrap_promises(data) : null;
    }
    return {
      node,
      loader,
      server: server_data_node,
      universal: ((_b = node.universal) == null ? void 0 : _b.load) ? { type: "data", data, uses } : null,
      data: data ?? (server_data_node == null ? void 0 : server_data_node.data) ?? null,
      slash: ((_c = node.universal) == null ? void 0 : _c.trailingSlash) ?? (server_data_node == null ? void 0 : server_data_node.slash)
    };
  }
  function has_changed(parent_changed, route_changed, url_changed, uses, params) {
    if (force_invalidation)
      return true;
    if (!uses)
      return false;
    if (uses.parent && parent_changed)
      return true;
    if (uses.route && route_changed)
      return true;
    if (uses.url && url_changed)
      return true;
    for (const param of uses.params) {
      if (params[param] !== current.params[param])
        return true;
    }
    for (const href of uses.dependencies) {
      if (invalidated.some((fn) => fn(new URL(href))))
        return true;
    }
    return false;
  }
  function create_data_node(node, previous) {
    if ((node == null ? void 0 : node.type) === "data")
      return node;
    if ((node == null ? void 0 : node.type) === "skip")
      return previous ?? null;
    return null;
  }
  async function load_route({ id, invalidating, url, params, route }) {
    if ((load_cache == null ? void 0 : load_cache.id) === id) {
      return load_cache.promise;
    }
    const { errors, layouts, leaf } = route;
    const loaders = [...layouts, leaf];
    errors.forEach((loader) => loader == null ? void 0 : loader().catch(() => {
    }));
    loaders.forEach((loader) => loader == null ? void 0 : loader[1]().catch(() => {
    }));
    let server_data = null;
    const url_changed = current.url ? id !== current.url.pathname + current.url.search : false;
    const route_changed = current.route ? route.id !== current.route.id : false;
    let parent_invalid = false;
    const invalid_server_nodes = loaders.map((loader, i) => {
      var _a2;
      const previous = current.branch[i];
      const invalid = !!(loader == null ? void 0 : loader[0]) && ((previous == null ? void 0 : previous.loader) !== loader[1] || has_changed(parent_invalid, route_changed, url_changed, (_a2 = previous.server) == null ? void 0 : _a2.uses, params));
      if (invalid) {
        parent_invalid = true;
      }
      return invalid;
    });
    if (invalid_server_nodes.some(Boolean)) {
      try {
        server_data = await load_data(url, invalid_server_nodes);
      } catch (error) {
        return load_root_error_page({
          status: error instanceof HttpError ? error.status : 500,
          error: await handle_error(error, { url, params, route: { id: route.id } }),
          url,
          route
        });
      }
      if (server_data.type === "redirect") {
        return server_data;
      }
    }
    const server_data_nodes = server_data == null ? void 0 : server_data.nodes;
    let parent_changed = false;
    const branch_promises = loaders.map(async (loader, i) => {
      var _a2;
      if (!loader)
        return;
      const previous = current.branch[i];
      const server_data_node = server_data_nodes == null ? void 0 : server_data_nodes[i];
      const valid = (!server_data_node || server_data_node.type === "skip") && loader[1] === (previous == null ? void 0 : previous.loader) && !has_changed(parent_changed, route_changed, url_changed, (_a2 = previous.universal) == null ? void 0 : _a2.uses, params);
      if (valid)
        return previous;
      parent_changed = true;
      if ((server_data_node == null ? void 0 : server_data_node.type) === "error") {
        throw server_data_node;
      }
      return load_node({
        loader: loader[1],
        url,
        params,
        route,
        parent: async () => {
          var _a3;
          const data = {};
          for (let j = 0; j < i; j += 1) {
            Object.assign(data, (_a3 = await branch_promises[j]) == null ? void 0 : _a3.data);
          }
          return data;
        },
        server_data_node: create_data_node(
          // server_data_node is undefined if it wasn't reloaded from the server;
          // and if current loader uses server data, we want to reuse previous data.
          server_data_node === void 0 && loader[0] ? { type: "skip" } : server_data_node ?? null,
          loader[0] ? previous == null ? void 0 : previous.server : void 0
        )
      });
    });
    for (const p of branch_promises)
      p.catch(() => {
      });
    const branch = [];
    for (let i = 0; i < loaders.length; i += 1) {
      if (loaders[i]) {
        try {
          branch.push(await branch_promises[i]);
        } catch (err) {
          if (err instanceof Redirect) {
            return {
              type: "redirect",
              location: err.location
            };
          }
          let status = 500;
          let error;
          if (server_data_nodes == null ? void 0 : server_data_nodes.includes(
            /** @type {import('types').ServerErrorNode} */
            err
          )) {
            status = /** @type {import('types').ServerErrorNode} */
            err.status ?? status;
            error = /** @type {import('types').ServerErrorNode} */
            err.error;
          } else if (err instanceof HttpError) {
            status = err.status;
            error = err.body;
          } else {
            const updated = await stores.updated.check();
            if (updated) {
              return await native_navigation(url);
            }
            error = await handle_error(err, { params, url, route: { id: route.id } });
          }
          const error_load = await load_nearest_error_page(i, branch, errors);
          if (error_load) {
            return await get_navigation_result_from_branch({
              url,
              params,
              branch: branch.slice(0, error_load.idx).concat(error_load.node),
              status,
              error,
              route
            });
          } else {
            return await server_fallback(url, { id: route.id }, error, status);
          }
        }
      } else {
        branch.push(void 0);
      }
    }
    return await get_navigation_result_from_branch({
      url,
      params,
      branch,
      status: 200,
      error: null,
      route,
      // Reset `form` on navigation, but not invalidation
      form: invalidating ? void 0 : null
    });
  }
  async function load_nearest_error_page(i, branch, errors) {
    while (i--) {
      if (errors[i]) {
        let j = i;
        while (!branch[j])
          j -= 1;
        try {
          return {
            idx: j + 1,
            node: {
              node: await /** @type {import('types').CSRPageNodeLoader } */
              errors[i](),
              loader: (
                /** @type {import('types').CSRPageNodeLoader } */
                errors[i]
              ),
              data: {},
              server: null,
              universal: null
            }
          };
        } catch (e) {
          continue;
        }
      }
    }
  }
  async function load_root_error_page({ status, error, url, route }) {
    const params = {};
    let server_data_node = null;
    const default_layout_has_server_load = app.server_loads[0] === 0;
    if (default_layout_has_server_load) {
      try {
        const server_data = await load_data(url, [true]);
        if (server_data.type !== "data" || server_data.nodes[0] && server_data.nodes[0].type !== "data") {
          throw 0;
        }
        server_data_node = server_data.nodes[0] ?? null;
      } catch {
        if (url.origin !== origin || url.pathname !== location.pathname || hydrated) {
          await native_navigation(url);
        }
      }
    }
    const root_layout = await load_node({
      loader: default_layout_loader,
      url,
      params,
      route,
      parent: () => Promise.resolve({}),
      server_data_node: create_data_node(server_data_node)
    });
    const root_error = {
      node: await default_error_loader(),
      loader: default_error_loader,
      universal: null,
      server: null,
      data: null
    };
    return await get_navigation_result_from_branch({
      url,
      params,
      branch: [root_layout, root_error],
      status,
      error,
      route: null
    });
  }
  function get_navigation_intent(url, invalidating) {
    if (is_external_url(url, base))
      return;
    const path = get_url_path(url);
    for (const route of routes) {
      const params = route.exec(path);
      if (params) {
        const id = url.pathname + url.search;
        const intent = { id, invalidating, route, params: decode_params(params), url };
        return intent;
      }
    }
  }
  function get_url_path(url) {
    return decode_pathname(url.pathname.slice(base.length) || "/");
  }
  function before_navigate({ url, type, intent, delta }) {
    let should_block = false;
    const nav = create_navigation(current, intent, url, type);
    if (delta !== void 0) {
      nav.navigation.delta = delta;
    }
    const cancellable = {
      ...nav.navigation,
      cancel: () => {
        should_block = true;
        nav.reject(new Error("navigation was cancelled"));
      }
    };
    if (!navigating) {
      callbacks.before_navigate.forEach((fn) => fn(cancellable));
    }
    return should_block ? null : nav;
  }
  async function navigate({
    url,
    scroll: scroll2,
    keepfocus,
    redirect_count,
    details,
    type,
    delta,
    nav_token = {},
    accepted,
    blocked
  }) {
    var _a2, _b, _c;
    const intent = get_navigation_intent(url, false);
    const nav = before_navigate({ url, type, delta, intent });
    if (!nav) {
      blocked();
      return;
    }
    const previous_history_index = current_history_index;
    accepted();
    navigating = true;
    if (started) {
      stores.navigating.set(nav.navigation);
    }
    token = nav_token;
    let navigation_result = intent && await load_route(intent);
    if (!navigation_result) {
      if (is_external_url(url, base)) {
        return await native_navigation(url);
      }
      navigation_result = await server_fallback(
        url,
        { id: null },
        await handle_error(new Error(`Not found: ${url.pathname}`), {
          url,
          params: {},
          route: { id: null }
        }),
        404
      );
    }
    url = (intent == null ? void 0 : intent.url) || url;
    if (token !== nav_token) {
      nav.reject(new Error("navigation was aborted"));
      return false;
    }
    if (navigation_result.type === "redirect") {
      if (redirect_count >= 20) {
        navigation_result = await load_root_error_page({
          status: 500,
          error: await handle_error(new Error("Redirect loop"), {
            url,
            params: {},
            route: { id: null }
          }),
          url,
          route: { id: null }
        });
      } else {
        goto(new URL(navigation_result.location, url).href, {}, redirect_count + 1, nav_token);
        return false;
      }
    } else if (
      /** @type {number} */
      ((_a2 = navigation_result.props.page) == null ? void 0 : _a2.status) >= 400
    ) {
      const updated = await stores.updated.check();
      if (updated) {
        await native_navigation(url);
      }
    }
    invalidated.length = 0;
    force_invalidation = false;
    updating = true;
    update_scroll_positions(previous_history_index);
    capture_snapshot(previous_history_index);
    if (((_b = navigation_result.props.page) == null ? void 0 : _b.url) && navigation_result.props.page.url.pathname !== url.pathname) {
      url.pathname = (_c = navigation_result.props.page) == null ? void 0 : _c.url.pathname;
    }
    if (details) {
      const change = details.replaceState ? 0 : 1;
      details.state[INDEX_KEY] = current_history_index += change;
      history[details.replaceState ? "replaceState" : "pushState"](details.state, "", url);
      if (!details.replaceState) {
        let i = current_history_index + 1;
        while (snapshots[i] || scroll_positions[i]) {
          delete snapshots[i];
          delete scroll_positions[i];
          i += 1;
        }
      }
    }
    load_cache = null;
    if (started) {
      current = navigation_result.state;
      if (navigation_result.props.page) {
        navigation_result.props.page.url = url;
      }
      const after_navigate = (await Promise.all(
        callbacks.on_navigate.map(
          (fn) => fn(
            /** @type {import('@sveltejs/kit').OnNavigate} */
            nav.navigation
          )
        )
      )).filter((value) => typeof value === "function");
      if (after_navigate.length > 0) {
        let cleanup = function() {
          callbacks.after_navigate = callbacks.after_navigate.filter(
            // @ts-ignore
            (fn) => !after_navigate.includes(fn)
          );
        };
        after_navigate.push(cleanup);
        callbacks.after_navigate.push(...after_navigate);
      }
      root.$set(navigation_result.props);
    } else {
      initialize(navigation_result);
    }
    const { activeElement } = document;
    await tick();
    if (autoscroll) {
      const deep_linked = url.hash && document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (scroll2) {
        scrollTo(scroll2.x, scroll2.y);
      } else if (deep_linked) {
        deep_linked.scrollIntoView();
      } else {
        scrollTo(0, 0);
      }
    }
    const changed_focus = (
      // reset focus only if any manual focus management didn't override it
      document.activeElement !== activeElement && // also refocus when activeElement is body already because the
      // focus event might not have been fired on it yet
      document.activeElement !== document.body
    );
    if (!keepfocus && !changed_focus) {
      reset_focus();
    }
    autoscroll = true;
    if (navigation_result.props.page) {
      page = navigation_result.props.page;
    }
    navigating = false;
    if (type === "popstate") {
      restore_snapshot(current_history_index);
    }
    nav.fulfil(void 0);
    callbacks.after_navigate.forEach(
      (fn) => fn(
        /** @type {import('@sveltejs/kit').AfterNavigate} */
        nav.navigation
      )
    );
    stores.navigating.set(null);
    updating = false;
  }
  async function server_fallback(url, route, error, status) {
    if (url.origin === origin && url.pathname === location.pathname && !hydrated) {
      return await load_root_error_page({
        status,
        error,
        url,
        route
      });
    }
    return await native_navigation(url);
  }
  function setup_preload() {
    let mousemove_timeout;
    container.addEventListener("mousemove", (event) => {
      const target2 = (
        /** @type {Element} */
        event.target
      );
      clearTimeout(mousemove_timeout);
      mousemove_timeout = setTimeout(() => {
        preload(target2, 2);
      }, 20);
    });
    function tap(event) {
      preload(
        /** @type {Element} */
        event.composedPath()[0],
        1
      );
    }
    container.addEventListener("mousedown", tap);
    container.addEventListener("touchstart", tap, { passive: true });
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            preload_code(
              get_url_path(new URL(
                /** @type {HTMLAnchorElement} */
                entry.target.href
              ))
            );
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0 }
    );
    function preload(element, priority) {
      const a = find_anchor(element, container);
      if (!a)
        return;
      const { url, external, download } = get_link_info(a, base);
      if (external || download)
        return;
      const options = get_router_options(a);
      if (!options.reload) {
        if (priority <= options.preload_data) {
          const intent = get_navigation_intent(
            /** @type {URL} */
            url,
            false
          );
          if (intent) {
            {
              preload_data(intent);
            }
          }
        } else if (priority <= options.preload_code) {
          preload_code(get_url_path(
            /** @type {URL} */
            url
          ));
        }
      }
    }
    function after_navigate() {
      observer.disconnect();
      for (const a of container.querySelectorAll("a")) {
        const { url, external, download } = get_link_info(a, base);
        if (external || download)
          continue;
        const options = get_router_options(a);
        if (options.reload)
          continue;
        if (options.preload_code === PRELOAD_PRIORITIES.viewport) {
          observer.observe(a);
        }
        if (options.preload_code === PRELOAD_PRIORITIES.eager) {
          preload_code(get_url_path(
            /** @type {URL} */
            url
          ));
        }
      }
    }
    callbacks.after_navigate.push(after_navigate);
    after_navigate();
  }
  function handle_error(error, event) {
    if (error instanceof HttpError) {
      return error.body;
    }
    return app.hooks.handleError({ error, event }) ?? /** @type {any} */
    { message: event.route.id != null ? "Internal Error" : "Not Found" };
  }
  return {
    after_navigate: (fn) => {
      onMount(() => {
        callbacks.after_navigate.push(fn);
        return () => {
          const i = callbacks.after_navigate.indexOf(fn);
          callbacks.after_navigate.splice(i, 1);
        };
      });
    },
    before_navigate: (fn) => {
      onMount(() => {
        callbacks.before_navigate.push(fn);
        return () => {
          const i = callbacks.before_navigate.indexOf(fn);
          callbacks.before_navigate.splice(i, 1);
        };
      });
    },
    on_navigate: (fn) => {
      onMount(() => {
        callbacks.on_navigate.push(fn);
        return () => {
          const i = callbacks.on_navigate.indexOf(fn);
          callbacks.on_navigate.splice(i, 1);
        };
      });
    },
    disable_scroll_handling: () => {
      if (updating || !started) {
        autoscroll = false;
      }
    },
    goto: (href, opts = {}) => {
      return goto(href, opts, 0);
    },
    invalidate: (resource) => {
      if (typeof resource === "function") {
        invalidated.push(resource);
      } else {
        const { href } = new URL(resource, location.href);
        invalidated.push((url) => url.href === href);
      }
      return invalidate();
    },
    invalidate_all: () => {
      force_invalidation = true;
      return invalidate();
    },
    preload_data: async (href) => {
      const url = new URL(href, get_base_uri(document));
      const intent = get_navigation_intent(url, false);
      if (!intent) {
        throw new Error(`Attempted to preload a URL that does not belong to this app: ${url}`);
      }
      await preload_data(intent);
    },
    preload_code,
    apply_action: async (result) => {
      if (result.type === "error") {
        const url = new URL(location.href);
        const { branch, route } = current;
        if (!route)
          return;
        const error_load = await load_nearest_error_page(
          current.branch.length,
          branch,
          route.errors
        );
        if (error_load) {
          const navigation_result = await get_navigation_result_from_branch({
            url,
            params: current.params,
            branch: branch.slice(0, error_load.idx).concat(error_load.node),
            status: result.status ?? 500,
            error: result.error,
            route
          });
          current = navigation_result.state;
          root.$set(navigation_result.props);
          tick().then(reset_focus);
        }
      } else if (result.type === "redirect") {
        goto(result.location, { invalidateAll: true }, 0);
      } else {
        root.$set({
          // this brings Svelte's view of the world in line with SvelteKit's
          // after use:enhance reset the form....
          form: null,
          page: { ...page, form: result.data, status: result.status }
        });
        await tick();
        root.$set({ form: result.data });
        if (result.type === "success") {
          reset_focus();
        }
      }
    },
    _start_router: () => {
      var _a2;
      history.scrollRestoration = "manual";
      addEventListener("beforeunload", (e) => {
        let should_block = false;
        persist_state();
        if (!navigating) {
          const nav = create_navigation(current, void 0, null, "leave");
          const navigation = {
            ...nav.navigation,
            cancel: () => {
              should_block = true;
              nav.reject(new Error("navigation was cancelled"));
            }
          };
          callbacks.before_navigate.forEach((fn) => fn(navigation));
        }
        if (should_block) {
          e.preventDefault();
          e.returnValue = "";
        } else {
          history.scrollRestoration = "auto";
        }
      });
      addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          persist_state();
        }
      });
      if (!((_a2 = navigator.connection) == null ? void 0 : _a2.saveData)) {
        setup_preload();
      }
      container.addEventListener("click", (event) => {
        var _a3;
        if (event.button || event.which !== 1)
          return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
          return;
        if (event.defaultPrevented)
          return;
        const a = find_anchor(
          /** @type {Element} */
          event.composedPath()[0],
          container
        );
        if (!a)
          return;
        const { url, external, target: target2, download } = get_link_info(a, base);
        if (!url)
          return;
        if (target2 === "_parent" || target2 === "_top") {
          if (window.parent !== window)
            return;
        } else if (target2 && target2 !== "_self") {
          return;
        }
        const options = get_router_options(a);
        const is_svg_a_element = a instanceof SVGAElement;
        if (!is_svg_a_element && url.protocol !== location.protocol && !(url.protocol === "https:" || url.protocol === "http:"))
          return;
        if (download)
          return;
        if (external || options.reload) {
          if (before_navigate({ url, type: "link" })) {
            navigating = true;
          } else {
            event.preventDefault();
          }
          return;
        }
        const [nonhash, hash2] = url.href.split("#");
        if (hash2 !== void 0 && nonhash === location.href.split("#")[0]) {
          if (current.url.hash === url.hash) {
            event.preventDefault();
            (_a3 = a.ownerDocument.getElementById(hash2)) == null ? void 0 : _a3.scrollIntoView();
            return;
          }
          hash_navigating = true;
          update_scroll_positions(current_history_index);
          update_url(url);
          if (!options.replace_state)
            return;
          hash_navigating = false;
          event.preventDefault();
        }
        navigate({
          url,
          scroll: options.noscroll ? scroll_state() : null,
          keepfocus: options.keep_focus ?? false,
          redirect_count: 0,
          details: {
            state: {},
            replaceState: options.replace_state ?? url.href === location.href
          },
          accepted: () => event.preventDefault(),
          blocked: () => event.preventDefault(),
          type: "link"
        });
      });
      container.addEventListener("submit", (event) => {
        if (event.defaultPrevented)
          return;
        const form = (
          /** @type {HTMLFormElement} */
          HTMLFormElement.prototype.cloneNode.call(event.target)
        );
        const submitter = (
          /** @type {HTMLButtonElement | HTMLInputElement | null} */
          event.submitter
        );
        const method = (submitter == null ? void 0 : submitter.formMethod) || form.method;
        if (method !== "get")
          return;
        const url = new URL(
          (submitter == null ? void 0 : submitter.hasAttribute("formaction")) && (submitter == null ? void 0 : submitter.formAction) || form.action
        );
        if (is_external_url(url, base))
          return;
        const event_form = (
          /** @type {HTMLFormElement} */
          event.target
        );
        const { keep_focus, noscroll, reload, replace_state } = get_router_options(event_form);
        if (reload)
          return;
        event.preventDefault();
        event.stopPropagation();
        const data = new FormData(event_form);
        const submitter_name = submitter == null ? void 0 : submitter.getAttribute("name");
        if (submitter_name) {
          data.append(submitter_name, (submitter == null ? void 0 : submitter.getAttribute("value")) ?? "");
        }
        url.search = new URLSearchParams(data).toString();
        navigate({
          url,
          scroll: noscroll ? scroll_state() : null,
          keepfocus: keep_focus ?? false,
          redirect_count: 0,
          details: {
            state: {},
            replaceState: replace_state ?? url.href === location.href
          },
          nav_token: {},
          accepted: () => {
          },
          blocked: () => {
          },
          type: "form"
        });
      });
      addEventListener("popstate", async (event) => {
        var _a3;
        token = {};
        if ((_a3 = event.state) == null ? void 0 : _a3[INDEX_KEY]) {
          if (event.state[INDEX_KEY] === current_history_index)
            return;
          const scroll2 = scroll_positions[event.state[INDEX_KEY]];
          const url = new URL(location.href);
          if (current.url.href.split("#")[0] === location.href.split("#")[0]) {
            update_url(url);
            scroll_positions[current_history_index] = scroll_state();
            current_history_index = event.state[INDEX_KEY];
            scrollTo(scroll2.x, scroll2.y);
            return;
          }
          const delta = event.state[INDEX_KEY] - current_history_index;
          await navigate({
            url,
            scroll: scroll2,
            keepfocus: false,
            redirect_count: 0,
            details: null,
            accepted: () => {
              current_history_index = event.state[INDEX_KEY];
            },
            blocked: () => {
              history.go(-delta);
            },
            type: "popstate",
            delta,
            nav_token: token
          });
        } else {
          if (!hash_navigating) {
            const url = new URL(location.href);
            update_url(url);
          }
        }
      });
      addEventListener("hashchange", () => {
        if (hash_navigating) {
          hash_navigating = false;
          history.replaceState(
            { ...history.state, [INDEX_KEY]: ++current_history_index },
            "",
            location.href
          );
        }
      });
      for (const link of document.querySelectorAll("link")) {
        if (link.rel === "icon")
          link.href = link.href;
      }
      addEventListener("pageshow", (event) => {
        if (event.persisted) {
          stores.navigating.set(null);
        }
      });
      function update_url(url) {
        current.url = url;
        stores.page.set({ ...page, url });
        stores.page.notify();
      }
    },
    _hydrate: async ({
      status = 200,
      error,
      node_ids,
      params,
      route,
      data: server_data_nodes,
      form
    }) => {
      hydrated = true;
      const url = new URL(location.href);
      {
        ({ params = {}, route = { id: null } } = get_navigation_intent(url, false) || {});
      }
      let result;
      try {
        const branch_promises = node_ids.map(async (n, i) => {
          const server_data_node = server_data_nodes[i];
          if (server_data_node == null ? void 0 : server_data_node.uses) {
            server_data_node.uses = deserialize_uses(server_data_node.uses);
          }
          return load_node({
            loader: app.nodes[n],
            url,
            params,
            route,
            parent: async () => {
              const data = {};
              for (let j = 0; j < i; j += 1) {
                Object.assign(data, (await branch_promises[j]).data);
              }
              return data;
            },
            server_data_node: create_data_node(server_data_node)
          });
        });
        const branch = await Promise.all(branch_promises);
        const parsed_route = routes.find(({ id }) => id === route.id);
        if (parsed_route) {
          const layouts = parsed_route.layouts;
          for (let i = 0; i < layouts.length; i++) {
            if (!layouts[i]) {
              branch.splice(i, 0, void 0);
            }
          }
        }
        result = await get_navigation_result_from_branch({
          url,
          params,
          branch,
          status,
          error,
          form,
          route: parsed_route ?? null
        });
      } catch (error2) {
        if (error2 instanceof Redirect) {
          await native_navigation(new URL(error2.location, location.href));
          return;
        }
        result = await load_root_error_page({
          status: error2 instanceof HttpError ? error2.status : 500,
          error: await handle_error(error2, { url, params, route }),
          url,
          route
        });
      }
      initialize(result);
    }
  };
}
async function load_data(url, invalid) {
  var _a;
  const data_url = new URL(url);
  data_url.pathname = add_data_suffix(url.pathname);
  if (url.pathname.endsWith("/")) {
    data_url.searchParams.append(TRAILING_SLASH_PARAM, "1");
  }
  data_url.searchParams.append(INVALIDATED_PARAM, invalid.map((i) => i ? "1" : "0").join(""));
  const res = await native_fetch(data_url.href);
  if ((_a = res.headers.get("content-type")) == null ? void 0 : _a.includes("text/html")) {
    await native_navigation(url);
  }
  if (!res.ok) {
    throw new HttpError(res.status, await res.json());
  }
  return new Promise(async (resolve) => {
    var _a2;
    const deferreds = /* @__PURE__ */ new Map();
    const reader = (
      /** @type {ReadableStream<Uint8Array>} */
      res.body.getReader()
    );
    const decoder = new TextDecoder();
    function deserialize(data) {
      return unflatten(data, {
        Promise: (id) => {
          return new Promise((fulfil, reject) => {
            deferreds.set(id, { fulfil, reject });
          });
        }
      });
    }
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done && !text)
        break;
      text += !value && text ? "\n" : decoder.decode(value);
      while (true) {
        const split = text.indexOf("\n");
        if (split === -1) {
          break;
        }
        const node = JSON.parse(text.slice(0, split));
        text = text.slice(split + 1);
        if (node.type === "redirect") {
          return resolve(node);
        }
        if (node.type === "data") {
          (_a2 = node.nodes) == null ? void 0 : _a2.forEach((node2) => {
            if ((node2 == null ? void 0 : node2.type) === "data") {
              node2.uses = deserialize_uses(node2.uses);
              node2.data = deserialize(node2.data);
            }
          });
          resolve(node);
        } else if (node.type === "chunk") {
          const { id, data, error } = node;
          const deferred = (
            /** @type {import('types').Deferred} */
            deferreds.get(id)
          );
          deferreds.delete(id);
          if (error) {
            deferred.reject(deserialize(error));
          } else {
            deferred.fulfil(deserialize(data));
          }
        }
      }
    }
  });
}
function deserialize_uses(uses) {
  return {
    dependencies: new Set((uses == null ? void 0 : uses.dependencies) ?? []),
    params: new Set((uses == null ? void 0 : uses.params) ?? []),
    parent: !!(uses == null ? void 0 : uses.parent),
    route: !!(uses == null ? void 0 : uses.route),
    url: !!(uses == null ? void 0 : uses.url)
  };
}
function reset_focus() {
  const autofocus = document.querySelector("[autofocus]");
  if (autofocus) {
    autofocus.focus();
  } else {
    const root = document.body;
    const tabindex = root.getAttribute("tabindex");
    root.tabIndex = -1;
    root.focus({ preventScroll: true, focusVisible: false });
    if (tabindex !== null) {
      root.setAttribute("tabindex", tabindex);
    } else {
      root.removeAttribute("tabindex");
    }
    const selection = getSelection();
    if (selection && selection.type !== "None") {
      const ranges = [];
      for (let i = 0; i < selection.rangeCount; i += 1) {
        ranges.push(selection.getRangeAt(i));
      }
      setTimeout(() => {
        if (selection.rangeCount !== ranges.length)
          return;
        for (let i = 0; i < selection.rangeCount; i += 1) {
          const a = ranges[i];
          const b = selection.getRangeAt(i);
          if (a.commonAncestorContainer !== b.commonAncestorContainer || a.startContainer !== b.startContainer || a.endContainer !== b.endContainer || a.startOffset !== b.startOffset || a.endOffset !== b.endOffset) {
            return;
          }
        }
        selection.removeAllRanges();
      });
    }
  }
}
function create_navigation(current, intent, url, type) {
  var _a, _b;
  let fulfil;
  let reject;
  const complete = new Promise((f, r) => {
    fulfil = f;
    reject = r;
  });
  complete.catch(() => {
  });
  const navigation = {
    from: {
      params: current.params,
      route: { id: ((_a = current.route) == null ? void 0 : _a.id) ?? null },
      url: current.url
    },
    to: url && {
      params: (intent == null ? void 0 : intent.params) ?? null,
      route: { id: ((_b = intent == null ? void 0 : intent.route) == null ? void 0 : _b.id) ?? null },
      url
    },
    willUnload: !intent,
    type,
    complete
  };
  return {
    navigation,
    // @ts-expect-error
    fulfil,
    // @ts-expect-error
    reject
  };
}
async function start(app, target, hydrate) {
  const client = create_client(app, target);
  init({ client });
  if (hydrate) {
    await client._hydrate(hydrate);
  } else {
    client.goto(location.href, { replaceState: true });
  }
  client._start_router();
}
export {
  start
};
