import {
	createSignal as _createSignal,
	createMemo as _createMemo,
	createRoot as _createRoot,
	createEffect as _createEffect,
	observable as _observable,
	from as _from,
	// @ts-ignore
} from "solid-js/dist/solid.js"

const createSignal = _createSignal as typeof import("solid-js")["createSignal"]
const createMemo = _createMemo as typeof import("solid-js")["createMemo"]
const createRoot = _createRoot as typeof import("solid-js")["createRoot"]
const createEffect = _createEffect as typeof import("solid-js")["createEffect"]
const observable = _observable as typeof import("solid-js")["observable"]
const from = _from as typeof import("solid-js")["from"]

export { createSignal, createMemo, createRoot, createEffect, observable, from }
