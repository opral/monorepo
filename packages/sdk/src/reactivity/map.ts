// @ts-nocheck
/* eslint-disable */

import { batch } from "./solid.js";
import { TriggerCache } from "./trigger.js";

// src/index.ts
var $KEYS = Symbol("track-keys");
var ReactiveMap = class extends Map {
  #keyTriggers = new TriggerCache();
  #valueTriggers = new TriggerCache();
  constructor(initial) {
    super();
    if (initial) for (const v of initial) super.set(v[0], v[1]);
  }
  // reads
  has(key) {
    this.#keyTriggers.track(key);
    return super.has(key);
  }
  get(key) {
    this.#valueTriggers.track(key);
    return super.get(key);
  }
  get size() {
    this.#keyTriggers.track($KEYS);
    return super.size;
  }
  keys() {
    this.#keyTriggers.track($KEYS);
    return super.keys();
  }
  values() {
    this.#keyTriggers.track($KEYS);
    for (const v of super.keys()) this.#valueTriggers.track(v);
    return super.values();
  }
  entries() {
    this.#keyTriggers.track($KEYS);
    for (const v of super.keys()) this.#valueTriggers.track(v);
    return super.entries();
  }
  // writes
  set(key, value) {
    batch(() => {
      if (super.has(key)) {
        if (super.get(key) === value) return;
      } else {
        this.#keyTriggers.dirty(key);
        this.#keyTriggers.dirty($KEYS);
      }
      this.#valueTriggers.dirty(key);
      super.set(key, value);
    });
    return this;
  }
  delete(key) {
    const r = super.delete(key);
    if (r) {
      batch(() => {
        this.#keyTriggers.dirty(key);
        this.#keyTriggers.dirty($KEYS);
        this.#valueTriggers.dirty(key);
      });
    }
    return r;
  }
  clear() {
    if (super.size) {
      batch(() => {
        for (const v of super.keys()) {
          this.#keyTriggers.dirty(v);
          this.#valueTriggers.dirty(v);
        }
        super.clear();
        this.#keyTriggers.dirty($KEYS);
      });
    }
  }
  // callback
  forEach(callbackfn) {
    this.#keyTriggers.track($KEYS);
    super.forEach((value, key) => callbackfn(value, key, this));
  }
  [Symbol.iterator]() {
    return this.entries();
  }
};
var ReactiveWeakMap = class extends WeakMap {
  #keyTriggers = new TriggerCache(WeakMap);
  #valueTriggers = new TriggerCache(WeakMap);
  constructor(initial) {
    super();
    if (initial) for (const v of initial) super.set(v[0], v[1]);
  }
  has(key) {
    this.#keyTriggers.track(key);
    return super.has(key);
  }
  get(key) {
    this.#valueTriggers.track(key);
    return super.get(key);
  }
  set(key, value) {
    batch(() => {
      if (super.has(key)) {
        if (super.get(key) === value) return;
      } else this.#keyTriggers.dirty(key);
      this.#valueTriggers.dirty(key);
      super.set(key, value);
    });
    return this;
  }
  delete(key) {
    const r = super.delete(key);
    if (r) {
      batch(() => {
        this.#keyTriggers.dirty(key);
        this.#valueTriggers.dirty(key);
      });
    }
    return r;
  }
};
function createMap(initial) {
  const map = new ReactiveMap(initial);
  return new Proxy(() => [...map], {
    get: (_, b) => map[b],
  });
}
function createWeakMap(initial) {
  return new ReactiveWeakMap(initial);
}

export { ReactiveMap, ReactiveWeakMap, createMap, createWeakMap };
