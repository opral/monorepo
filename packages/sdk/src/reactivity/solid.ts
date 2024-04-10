import {
	createSignal as _createSignal,
	createMemo as _createMemo,
	createRoot as _createRoot,
	createEffect as _createEffect,
	createResource as _createResource,
	observable as _observable,
	batch as _batch,
	from as _from,
	getListener as _getListener,
	onCleanup as _onCleanup,
	DEV,
	// @ts-ignore
} from "solid-js/dist/solid.js"

const createSignal = _createSignal as typeof import("solid-js")["createSignal"]
const createMemo = _createMemo as typeof import("solid-js")["createMemo"]
const createRoot = _createRoot as typeof import("solid-js")["createRoot"]
const createEffect = _createEffect as typeof import("solid-js")["createEffect"]
const createResource = _createResource as typeof import("solid-js")["createResource"]
const observable = _observable as typeof import("solid-js")["observable"]
const from = _from as typeof import("solid-js")["from"]
const batch = _batch as typeof import("solid-js")["batch"]
const getListener = _getListener as typeof import("solid-js")["getListener"]
const onCleanup = _onCleanup as typeof import("solid-js")["onCleanup"]

export {
	createSignal,
	createMemo,
	createRoot,
	createEffect,
	createResource,
	observable,
	from,
	batch,
	getListener,
	onCleanup,
	DEV,
}
