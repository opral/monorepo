import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SQLocalDrizzle } from '../../src/drizzle';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { int, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { desc, eq, relations, sql as dsql } from 'drizzle-orm';
import { sleep } from '../test-utils/sleep';

describe('drizzle driver', () => {
	const { sql, driver, batchDriver, transaction } = new SQLocalDrizzle(
		'drizzle-driver-test.sqlite3'
	);

	const groceries = sqliteTable('groceries', {
		id: int('id').primaryKey({ autoIncrement: true }),
		name: text('name').notNull(),
	});

	const groceriesRelations = relations(groceries, ({ many }) => ({
		prices: many(prices),
	}));

	const prices = sqliteTable('prices', {
		id: int('id').primaryKey({ autoIncrement: true }),
		groceryId: int('groceryId').notNull(),
		price: real('price').notNull(),
	});

	const pricesRelations = relations(prices, ({ one }) => ({
		grocery: one(groceries, {
			fields: [prices.groceryId],
			references: [groceries.id],
		}),
	}));

	const db = drizzle(driver, batchDriver, {
		schema: { groceries, groceriesRelations, prices, pricesRelations },
	});

	beforeEach(async () => {
		await sql`CREATE TABLE groceries (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)`;
		await sql`CREATE TABLE prices (id INTEGER PRIMARY KEY AUTOINCREMENT, groceryId INTEGER NOT NULL, price REAL NOT NULL)`;
	});

	afterEach(async () => {
		await sql`DROP TABLE groceries`;
		await sql`DROP TABLE prices`;
	});

	it('should execute queries', async () => {
		const insert1Prepared = db
			.insert(groceries)
			.values({ name: dsql.placeholder('name') })
			.returning({ name: groceries.name })
			.prepare();
		const items = ['bread', 'milk', 'rice'];

		for (let item of items) {
			const insert1 = await insert1Prepared.get({ name: item });
			expect(insert1).toEqual({ name: item });
		}

		const select1 = await db.select().from(groceries).all();
		expect(select1).toEqual([
			{ id: 1, name: 'bread' },
			{ id: 2, name: 'milk' },
			{ id: 3, name: 'rice' },
		]);

		const delete1 = await db
			.delete(groceries)
			.where(eq(groceries.id, 2))
			.returning()
			.get();
		expect(delete1).toEqual({ id: 2, name: 'milk' });

		const update1 = await db
			.update(groceries)
			.set({ name: 'white rice' })
			.where(eq(groceries.id, 3))
			.returning({ name: groceries.name })
			.all();
		expect(update1).toEqual([{ name: 'white rice' }]);

		const select2 = await db
			.select({ name: groceries.name })
			.from(groceries)
			.orderBy(desc(groceries.id))
			.all();
		expect(select2).toEqual([{ name: 'white rice' }, { name: 'bread' }]);
	});

	it('should perform successful transaction using sqlocal way', async () => {
		const productName = 'rice';
		const productPrice = 2.99;

		const newProductId = await transaction(async (tx) => {
			const [product] = await tx.query(
				db.insert(groceries).values({ name: productName }).returning()
			);
			await tx.query(
				db.insert(prices).values({ groceryId: product.id, price: productPrice })
			);
			return product.id;
		});

		expect(newProductId).toBe(1);

		const selectData1 = await db.select().from(groceries).all();
		expect(selectData1.length).toBe(1);
		const selectData2 = await db.select().from(prices).all();
		expect(selectData2.length).toBe(1);
	});

	it('should rollback failed transaction using sqlocal way', async () => {
		const recordCount = await transaction(async ({ query }) => {
			await query(db.insert(groceries).values({ name: 'apples' }));
			await query(db.insert(groceries).values({ nam: 'bananas' } as any));
			const data = await query(db.select().from(groceries));
			return data.length;
		}).catch(() => null);

		expect(recordCount).toBe(null);

		const data = await db.select().from(groceries).all();
		expect(data.length).toBe(0);
	});

	it('should isolate transaction mutations using sqlocal way', async () => {
		const order: number[] = [];

		await Promise.all([
			transaction(async ({ query }) => {
				order.push(1);
				await query(db.insert(groceries).values({ name: 'a' }));
				await sleep(200);
				order.push(3);
				await query(db.insert(groceries).values({ name: 'b' }));
			}),
			(async () => {
				await sleep(100);
				order.push(2);
				await db.update(groceries).set({ name: 'x' }).run();
			})(),
		]);

		const data = await db
			.select({ name: groceries.name })
			.from(groceries)
			.all();

		expect(data).toEqual([{ name: 'x' }, { name: 'x' }]);
		expect(order).toEqual([1, 2, 3]);
	});

	it('should perform successful transaction using drizzle way', async () => {
		await db.transaction(async (tx) => {
			await tx.insert(groceries).values({ name: 'apples' }).run();
			await tx.insert(groceries).values({ name: 'bananas' }).run();
		});

		const data = await db.select().from(groceries).all();
		expect(data.length).toBe(2);
	});

	it('should rollback failed transaction using drizzle way', async () => {
		await db
			.transaction(async (tx) => {
				await tx.insert(groceries).values({ name: 'apples' }).run();
				await tx
					.insert(groceries)
					.values({ nam: 'bananas' } as any)
					.run();
			})
			.catch(() => {});

		const data = await db.select().from(groceries).all();
		expect(data.length).toBe(0);
	});

	it('should NOT isolate transaction mutations using drizzle way', async () => {
		const order: number[] = [];

		await Promise.all([
			db.transaction(async (tx) => {
				order.push(1);
				await tx.insert(groceries).values({ name: 'a' }).run();
				await sleep(200);
				order.push(3);
				await tx.insert(groceries).values({ name: 'b' }).run();
			}),
			(async () => {
				await sleep(100);
				order.push(2);
				await db.update(groceries).set({ name: 'x' }).run();
			})(),
		]);

		const data = await db
			.select({ name: groceries.name })
			.from(groceries)
			.all();

		expect(data).toEqual([{ name: 'x' }, { name: 'b' }]);
		expect(order).toEqual([1, 2, 3]);
	});

	it('should accept batched queries', async () => {
		const data = await db.batch([
			db.insert(groceries).values({ name: 'bread' }),
			db
				.insert(groceries)
				.values({ name: 'rice' })
				.returning({ name: groceries.name }),
			db.insert(groceries).values({ name: 'milk' }).returning(),
			db.select().from(groceries),
		]);

		expect(data).toEqual([
			{ rows: [], columns: [] },
			[{ name: 'rice' }],
			[{ id: 3, name: 'milk' }],
			[
				{ id: 1, name: 'bread' },
				{ id: 2, name: 'rice' },
				{ id: 3, name: 'milk' },
			],
		]);
	});

	it('should execute relational queries', async () => {
		await db.batch([
			db.insert(groceries).values({ name: 'chicken' }),
			db.insert(groceries).values({ name: 'beef' }),
			db.insert(prices).values([
				{ groceryId: 1, price: 3.29 },
				{ groceryId: 1, price: 2.99 },
				{ groceryId: 1, price: 3.79 },
				{ groceryId: 2, price: 5.29 },
				{ groceryId: 2, price: 4.49 },
			]),
		]);

		const data = await db.query.groceries.findMany({
			columns: {
				name: true,
			},
			with: {
				prices: {
					columns: {
						price: true,
					},
				},
			},
		});

		expect(data).toEqual([
			{
				name: 'chicken',
				prices: [{ price: 3.29 }, { price: 2.99 }, { price: 3.79 }],
			},
			{
				name: 'beef',
				prices: [{ price: 5.29 }, { price: 4.49 }],
			},
		]);
	});
});
