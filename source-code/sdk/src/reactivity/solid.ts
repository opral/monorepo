import {
	createSignal as _createSignal,
	createMemo as _createMemo,
	createRoot as _createRoot,
	createEffect as _createEffect,
	observable as _observable,
	batch as _batch,
	from as _from,
	// @ts-ignore
} from "solid-js/dist/solid.js"

// @ts-ignore
import { createStore as _createStore } from "solid-js/store/dist/store.js"

const createSignal = _createSignal as typeof import("solid-js")["createSignal"]
const createMemo = _createMemo as typeof import("solid-js")["createMemo"]
const createRoot = _createRoot as typeof import("solid-js")["createRoot"]
const createEffect = _createEffect as typeof import("solid-js")["createEffect"]
const observable = _observable as typeof import("solid-js")["observable"]
const from = _from as typeof import("solid-js")["from"]
const batch = _batch as typeof import("solid-js")["batch"]

const createStore = _createStore as typeof import("solid-js/store")["createStore"]

export { createSignal, createMemo, createRoot, createEffect, observable, from, batch, createStore }
