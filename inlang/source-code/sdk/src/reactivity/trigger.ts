// @ts-nocheck
/* eslint-disable */

import { createSignal, getListener, onCleanup, DEV } from "./solid.js";

const noop = () => {};

const isServer = false;

// src/index.ts
var triggerOptions =
  !isServer && DEV ? { equals: false, name: "trigger" } : { equals: false };
var triggerCacheOptions =
  !isServer && DEV ? { equals: false, internal: true } : triggerOptions;
function createTrigger() {
  if (isServer) {
    return [noop, noop];
  }
  return createSignal(void 0, triggerOptions);
}
var TriggerCache = class {
  #map;
  constructor(mapConstructor = Map) {
    this.#map = new mapConstructor();
  }
  dirty(key) {
    if (isServer) return;
    this.#map.get(key)?.$$();
  }
  track(key) {
    if (!getListener()) return;
    let trigger = this.#map.get(key);
    if (!trigger) {
      const [$, $$] = createSignal(void 0, triggerCacheOptions);
      this.#map.set(key, (trigger = { $, $$, n: 1 }));
    } else trigger.n++;
    onCleanup(() => {
      if (trigger.n-- === 1)
        queueMicrotask(() => trigger.n === 0 && this.#map.delete(key));
    });
    trigger.$();
  }
};
function createTriggerCache(mapConstructor = Map) {
  const map = new TriggerCache(mapConstructor);
  return [map.track.bind(map), map.dirty.bind(map)];
}

export { TriggerCache, createTrigger, createTriggerCache };
