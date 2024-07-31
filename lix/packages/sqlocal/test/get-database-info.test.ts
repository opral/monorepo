import { afterEach, describe, expect, it } from 'vitest';
import { SQLocal } from '../src/index';

describe('getDatabaseInfo', () => {
	const { sql, getDatabaseInfo } = new SQLocal(
		'get-database-info-test.sqlite3'
	);

	afterEach(async () => {
		const opfs = await navigator.storage.getDirectory();
		await opfs.removeEntry('get-database-info-test.sqlite3');
	});

	it('should return information about the database', async () => {
		const info1 = await getDatabaseInfo();
		expect(info1).toEqual({
			databasePath: 'get-database-info-test.sqlite3',
			databaseSizeBytes: 0,
			storageType: 'opfs',
			persisted: false,
		});

		await sql`CREATE TABLE nums (num INTEGER NOT NULL)`;
		await sql`INSERT INTO nums (num) VALUES (493), (820), (361), (125)`;

		const info2 = await getDatabaseInfo();
		expect(info2.databaseSizeBytes).toBeGreaterThan(0);
	});
});
