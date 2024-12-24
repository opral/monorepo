import { test, expect } from "vitest";
import { createDialect, createInMemoryDatabase } from "sqlite-wasm-kysely";
import { Kysely } from "kysely";
import { pollQuery } from "./pollQuery.js";
import { firstValueFrom } from "rxjs";

test("it should immediately execute the query irrespective of the interval", async () => {
	const observable = pollQuery(() => Promise.resolve("hello"), {
		interval: 100000,
	});

	const timeBefore = Date.now();
	const value = await firstValueFrom(observable);
	const timeAfter = Date.now();

	expect(value).toBe("hello");
	expect(timeAfter - timeBefore).toBeLessThan(100);
});

test("polling should work", async () => {
	const database = await createInMemoryDatabase({});

	const db = new Kysely<{
		mock: {
			id: string;
			path: string;
		};
	}>({
		dialect: createDialect({
			database,
		}),
	});

	await db.schema
		.createTable("mock")
		.addColumn("id", "text")
		.addColumn("path", "text")
		.execute();

	const emittedValues: any[] = [];

	const interval = 10;

	const observable = pollQuery(
		() => db.selectFrom("mock").where("id", "=", "joker").selectAll().execute(),
		{ interval }
	);

	observable.subscribe((value) => emittedValues.push(value));

	expect(emittedValues).lengthOf(0);

	// first Value from should work
	await db.insertInto("mock").values({ id: "joker", path: "batman" }).execute();
	await firstValueFrom(observable);
	expect(emittedValues).lengthOf(1);
	expect(emittedValues.at(-1)).toEqual([{ id: "joker", path: "batman" }]);

	// unrelated query
	await db.insertInto("mock").values({ id: "color", path: "robin" }).execute();
	await new Promise((resolve) => setTimeout(resolve, interval * 2));
	await db
		.updateTable("mock")
		.where("id", "=", "color")
		.set({ path: "barney" })
		.execute();

	// the observable should return the last value if a new subscripton is created.
	// the subscription is simulated with `firstValueFrom`
	const valueInObservable = await firstValueFrom(observable);
	expect(emittedValues).lengthOf(1);
	expect(emittedValues.at(-1)).toEqual([{ id: "joker", path: "batman" }]);
	expect(valueInObservable).toEqual([{ id: "joker", path: "batman" }]);

	// mutating the query of interest, this should trigger the observable
	await db
		.updateTable("mock")
		.where("id", "=", "joker")
		.set({ path: "superman" })
		.execute();

	await new Promise((resolve) => setTimeout(resolve, interval * 2));
	const valueInObservable2 = await firstValueFrom(observable);

	expect(emittedValues).lengthOf(2);
	expect(emittedValues.at(-1)).toEqual([{ id: "joker", path: "superman" }]);
	expect(valueInObservable2).toEqual([{ id: "joker", path: "superman" }]);
});
