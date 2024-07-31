import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SQLocal } from '../src/index';

describe('sql', () => {
	const { sql } = new SQLocal('sql-test.sqlite3');

	beforeEach(async () => {
		await sql`CREATE TABLE groceries (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)`;
	});

	afterEach(async () => {
		await sql`DROP TABLE groceries`;
	});

	it('should execute queries', async () => {
		const items = ['bread', 'milk', 'rice'];
		for (let item of items) {
			const insert1 =
				await sql`INSERT INTO groceries (name) VALUES (${item}) RETURNING name`;
			expect(insert1).toEqual([{ name: item }]);
		}

		const select1 = await sql`SELECT * FROM groceries`;
		expect(select1).toEqual([
			{ id: 1, name: 'bread' },
			{ id: 2, name: 'milk' },
			{ id: 3, name: 'rice' },
		]);

		const multiSelect1 =
			await sql`SELECT * FROM groceries WHERE id = ${3}; SELECT * FROM groceries WHERE id = 2;`;
		expect(multiSelect1).toEqual([{ id: 3, name: 'rice' }]);

		const multiSelect2 = async () =>
			await sql`SELECT * FROM groceries WHERE id = ${3}; SELECT * FROM groceries WHERE id = ${2};`;
		expect(multiSelect2).rejects.toThrow();

		const delete1 = await sql`DELETE FROM groceries WHERE id = 2 RETURNING *`;
		expect(delete1).toEqual([{ id: 2, name: 'milk' }]);

		const update1 =
			await sql`UPDATE groceries SET name = 'white rice' WHERE id = 3 RETURNING name`;
		expect(update1).toEqual([{ name: 'white rice' }]);

		const select2 = await sql`SELECT name FROM groceries ORDER BY id DESC`;
		expect(select2).toEqual([{ name: 'white rice' }, { name: 'bread' }]);

		const sqlStr = 'SELECT name FROM groceries WHERE id = ?';
		const select3 = await sql(sqlStr, 1);
		expect(select3).toEqual([{ name: 'bread' }]);
	});
});
