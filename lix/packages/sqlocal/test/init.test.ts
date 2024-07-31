import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SQLocal } from '../src/index';

describe('init', () => {
	const databasePath = 'init-test.sqlite3';
	const { sql } = new SQLocal(databasePath);

	beforeEach(async () => {
		await sql`CREATE TABLE nums (num INTEGER NOT NULL)`;
		await sql`INSERT INTO nums (num) VALUES (0)`;
	});

	afterEach(async () => {
		await sql`DROP TABLE nums`;
	});

	afterAll(async () => {
		const opfs = await navigator.storage.getDirectory();
		await opfs.removeEntry(databasePath);
	});

	it('should be cross-origin isolated', () => {
		expect(crossOriginIsolated).toBe(true);
	});

	it('should create a file in the OPFS', async () => {
		const opfs = await navigator.storage.getDirectory();
		const fileHandle = await opfs.getFileHandle(databasePath);
		const file = await fileHandle.getFile();
		expect(file.size).toBeGreaterThan(0);
	});

	it('should enable read-only mode', async () => {
		const { sql, destroy } = new SQLocal({
			storage: {
				path: databasePath,
				type: 'opfs',
			},
			readOnly: true,
		});

		const write = async () => {
			await sql`INSERT INTO nums (num) VALUES (1)`;
		};
		expect(write).rejects.toThrowError(
			'SQLITE_IOERR_WRITE: sqlite3 result code 778: disk I/O error'
		);

		const read = async () => {
			return await sql`SELECT * FROM nums`;
		};
		const data = await read();
		expect(data).toEqual([{ num: 0 }]);

		await destroy();
	});
});
