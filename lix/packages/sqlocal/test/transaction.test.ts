import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SQLocal } from '../src/index';
import { sleep } from './test-utils/sleep';

describe('transaction', () => {
	const { sql, transaction } = new SQLocal('transaction-test.sqlite3');

	beforeEach(async () => {
		await sql`CREATE TABLE groceries (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)`;
		await sql`CREATE TABLE prices (id INTEGER PRIMARY KEY AUTOINCREMENT, groceryId INTEGER NOT NULL, price REAL NOT NULL)`;
	});

	afterEach(async () => {
		await sql`DROP TABLE groceries`;
		await sql`DROP TABLE prices`;
		
	});

	it('should perform successful transaction', async () => {
		const productName = 'rice';
		const productPrice = 2.99;

		const newProductId = await transaction(async (tx) => {
			const [product] = await tx.sql`
				INSERT INTO groceries (name) VALUES (${productName}) RETURNING *
			`;
			await tx.sql`
				INSERT INTO prices (groceryId, price) VALUES (${product.id}, ${productPrice})
			`;
			return product.id;
		});

		expect(newProductId).toBe(1);

		const selectData1 = await sql`SELECT * FROM groceries`;
		expect(selectData1.length).toBe(1);
		const selectData2 = await sql`SELECT * FROM prices`;
		expect(selectData2.length).toBe(1);
	});

	it('should rollback failed transaction', async () => {
		const txData = await transaction(async (tx) => {
			await tx.sql`INSERT INTO groceries (name) VALUES ('carrots')`;
			await tx.sql`INSERT INT groceries (name) VALUES ('lettuce')`;
			return true;
		}).catch(() => false);

		expect(txData).toEqual(false);

		const selectData = await sql`SELECT * FROM groceries`;
		expect(selectData.length).toBe(0);
	});

	it('should isolate transaction mutations', async () => {
		const order: number[] = [];

		await Promise.all([
			transaction(async (tx) => {
				order.push(1);
				await tx.sql`INSERT INTO groceries (name) VALUES ('a')`;
				await sleep(200);
				order.push(3);
				await tx.sql`INSERT INTO groceries (name) VALUES ('b')`;
			}),
			(async () => {
				await sleep(100);
				order.push(2);
				await sql`UPDATE groceries SET name = 'x'`;
			})(),
		]);

		const data = await sql`SELECT name FROM groceries`;

		expect(data).toEqual([{ name: 'x' }, { name: 'x' }]);
		expect(order).toEqual([1, 2, 3]);
	});
});
