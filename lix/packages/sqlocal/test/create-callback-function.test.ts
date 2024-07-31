import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SQLocal } from '../src/index';

describe('createCallbackFunction', () => {
	const { sql, createCallbackFunction } = new SQLocal(
		'create-callback-function-test.sqlite3'
	);

	beforeEach(async () => {
		await sql`CREATE TABLE groceries (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)`;
	});

	afterEach(async () => {
		await sql`DROP TABLE groceries`;
	});

	it('should create and trigger callback function', async () => {
		let callbackRan = false;
		let callbackValue = '';

		await createCallbackFunction('testCallback', (value: string) => {
			callbackRan = true;
			callbackValue = value;
		});

		const createBadFn = async () =>
			await createCallbackFunction('testCallback', () => {});
		await expect(createBadFn).rejects.toThrowError();

		await sql`
      CREATE TEMP TRIGGER groceriesInsertTrigger AFTER INSERT ON groceries
      BEGIN
        SELECT testCallback(new.name);
      END
    `;

		await sql`INSERT INTO groceries (name) VALUES ('bread')`;

		expect(callbackRan).toBe(true);
		expect(callbackValue).toBe('bread');

		const duplicateFunction = async () =>
			await createCallbackFunction('testCallback', () => {});
		await expect(duplicateFunction).rejects.toThrowError();
	});
});
