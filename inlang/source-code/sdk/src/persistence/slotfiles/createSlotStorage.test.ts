import { test, expect } from "vitest"
import createSlotStorage from "./createSlotStorage.js"
import fs from "node:fs/promises"

type DocumentExample = {
	id: string
	content: string
}

// TODO write test if new file gets created on collison
// TODO test that inserting the same item fails on memory
// TODO test that inserting the same item (id) fails between processes
// TODO test that data witten by another process reaches the process via fs events

// test("roundtrip (saving/loading messages)", async () => {

// }, 1000000000)
