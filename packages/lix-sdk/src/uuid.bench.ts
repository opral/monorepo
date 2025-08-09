import { bench } from "vitest";
import { v7 } from "uuid";

bench("generate 100 UUIDs", () => {
	const uuids = [];
	for (let i = 0; i < 100; i++) {
		uuids.push(v7());
	}
});

bench("generate 200 UUIDs", () => {
	const uuids = [];
	for (let i = 0; i < 200; i++) {
		uuids.push(v7());
	}
});

bench("generate 500 UUIDs", () => {
	const uuids = [];
	for (let i = 0; i < 500; i++) {
		uuids.push(v7());
	}
});

bench("generate 1000 UUIDs", () => {
	const uuids = [];
	for (let i = 0; i < 1000; i++) {
		uuids.push(v7());
	}
});
