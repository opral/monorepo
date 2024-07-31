import { afterEach, describe, expect, it } from 'vitest';
import { SQLocal } from '../src/index';

describe('getDatabaseContent', () => {
	const fileName = 'get-database-file-test.sqlite3';
	const paths = [[], [''], ['top'], ['one', 'two']];

	afterEach(async () => {
		const opfs = await navigator.storage.getDirectory();
		for (let path of paths) {
			try {
				let dirHandle = await navigator.storage.getDirectory();

				for (let dirName of path) {
					if (dirName === '') continue;
					dirHandle = await dirHandle.getDirectoryHandle(dirName);
				}

				await dirHandle.removeEntry(fileName);
			} catch (e) {
				// cleanup is allowed to fails
			}
		}
	});

	it('should return the requested database content on opfs', async () => {
		for (let path of paths) {
			const databasePath = [...path, fileName].join('/');
			const { sql, getDatabaseContent, getDatabaseInfo } = new SQLocal(
				databasePath
			);

			await sql`CREATE TABLE nums (num REAL NOT NULL)`;

			const content = await getDatabaseContent();

			let dirHandle = await navigator.storage.getDirectory();

			for (let dirName of path) {
				if (dirName === '') continue;
				dirHandle = await dirHandle.getDirectoryHandle(dirName);
			}

			await dirHandle.removeEntry(fileName);
		}
	});

	it('should return the requested database content on memory', async () => {
		const { sql, getDatabaseContent } = new SQLocal({
			storage: {
				type: 'memory',
			},
		});

		await sql`CREATE TABLE nums (num REAL NOT NULL)`;
		const content = await getDatabaseContent();

		expect(content).toBeInstanceOf(Uint8Array);
	});

	// it('should throw when requested database has not been created', async () => {
	// 	const { getDatabaseFile } = new SQLocal(fileName);
	// 	expect(async () => await getDatabaseFile()).rejects.toThrowError(
	// 		'A requested file or directory could not be found at the time an operation was processed.'
	// 	);
	// });
});
