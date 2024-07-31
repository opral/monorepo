import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import coincident from 'coincident';
import type {
	DataMessage,
	DestroyMessage,
	QueryMessage,
	Sqlite3,
	Sqlite3Db,
	BatchMessage,
	ProcessorConfig,
	FunctionMessage,
	UserFunction,
	OutputMessage,
	InputMessage,
	ImportMessage,
	WorkerProxy,
	GetInfoMessage,
	Sqlite3StorageType,
	ConfigMessage,
	QueryKey,
	TransactionMessage,
	ExportMessage,
} from './types.js';
import { createMutex } from './lib/create-mutex.js';
import { execOnDb } from './lib/exec-on-db.js';

export class SQLocalProcessor {
	protected sqlite3: Sqlite3 | undefined;
	protected db: Sqlite3Db | undefined;
	protected dbStorageType: Sqlite3StorageType | undefined;
	protected config: ProcessorConfig = {};
	protected userFunctions = new Map<string, UserFunction>();

	protected initMutex = createMutex();
	protected transactionMutex = createMutex();
	protected transactionKey: QueryKey | null = null;

	protected proxy: WorkerProxy;

	onmessage: ((message: OutputMessage) => void) | undefined;

	constructor(worker: typeof globalThis) {
		this.proxy = coincident(worker) as WorkerProxy;
		this.init();
	}

	protected init = async (): Promise<void> => {
		if (!this.config.storage) return;

		await this.initMutex.lock();

		const { readOnly, verbose } = this.config;
		const flags = [
			readOnly === true ? 'r' : 'cw',
			verbose === true ? 't' : '',
		].join('');

		try {
			if (!this.sqlite3) {
				this.sqlite3 = await sqlite3InitModule();
			}

			if (this.db) {
				this.destroy();
			}
			if (this.config.storage?.type === 'opfs') {
				if (!('opfs' in this.sqlite3)) {
					throw new Error('OPFS not available');
				}
				this.db = new this.sqlite3.oo1.OpfsDb(this.config.storage.path, flags);
				this.dbStorageType = 'opfs';
			} else if (this.config.storage?.type === 'fs') {
				throw new Error('FS not supported');
			} else {
				this.db = new this.sqlite3.oo1.DB(':memory:', flags);
				this.dbStorageType = 'memory';
			}
		} catch (error) {
			this.emitMessage({
				type: 'error',
				error,
				queryKey: null,
			});

			this.destroy();
			return;
		}

		this.userFunctions.forEach(this.initUserFunction);
		await this.initMutex.unlock();
	};

	postMessage = async (
		message: InputMessage | MessageEvent<InputMessage>
	): Promise<void> => {
		if (message instanceof MessageEvent) {
			message = message.data;
		}

		await this.initMutex.lock();

		switch (message.type) {
			case 'config':
				this.editConfig(message);
				break;
			case 'query':
			case 'batch':
			case 'transaction':
				this.exec(message);
				break;
			case 'function':
				this.createUserFunction(message);
				break;
			case 'getinfo':
				this.getDatabaseInfo(message);
				break;
			case 'export':
				this.getDatabaseExport(message);
				break;
			case 'import':
				this.importDb(message);
				break;
			case 'destroy':
				this.destroy(message);
				break;
		}

		await this.initMutex.unlock();
	};

	protected emitMessage = (message: OutputMessage): void => {
		if (this.onmessage) {
			this.onmessage(message);
		}
	};

	protected editConfig = (message: ConfigMessage) => {
		this.config = message.config;
		this.init();
	};

	protected exec = async (
		message: QueryMessage | BatchMessage | TransactionMessage
	): Promise<void> => {
		if (!this.db) return;

		const partOfTransaction =
			(message.type === 'transaction' &&
				(this.transactionKey === null ||
					message.transactionKey === this.transactionKey)) ||
			(message.type === 'query' &&
				message.transactionKey === this.transactionKey);

		if (!partOfTransaction) {
			await this.transactionMutex.lock();
		}

		try {
			const response: DataMessage = {
				type: 'data',
				queryKey: message.queryKey,
				data: [],
			};

			switch (message.type) {
				case 'query':
					const statementData = execOnDb(this.db, message);
					response.data.push(statementData);
					break;

				case 'batch':
					this.db.transaction((tx: Sqlite3Db) => {
						for (let statement of message.statements) {
							const statementData = execOnDb(tx, statement);
							response.data.push(statementData);
						}
					});
					break;

				case 'transaction':
					if (message.action === 'begin') {
						await this.transactionMutex.lock();
						this.transactionKey = message.transactionKey;
						this.db.exec({ sql: 'BEGIN' });
					}

					if (message.action === 'commit' || message.action === 'rollback') {
						const sql = message.action === 'commit' ? 'COMMIT' : 'ROLLBACK';
						this.db.exec({ sql });
						this.transactionKey = null;
						await this.transactionMutex.unlock();
					}
					break;
			}

			this.emitMessage(response);
		} catch (error) {
			this.emitMessage({
				type: 'error',
				error,
				queryKey: message.queryKey,
			});
		}

		if (!partOfTransaction) {
			await this.transactionMutex.unlock();
		}
	};

	protected getDatabaseInfo = async (
		message: GetInfoMessage
	): Promise<void> => {
		try {
			const storageType = this.dbStorageType;
			const databasePath =
				this.config.storage?.type !== 'memory'
					? this.config.storage!.path
					: undefined;
			const persisted =
				storageType !== undefined
					? storageType !== 'memory'
						? await navigator.storage?.persisted()
						: false
					: undefined;

			const sizeResult = this.db?.exec({
				sql: 'SELECT page_count * page_size AS size FROM pragma_page_count(), pragma_page_size()',
				returnValue: 'resultRows',
				rowMode: 'array',
			});
			const size = sizeResult?.[0]?.[0];
			const databaseSizeBytes = typeof size === 'number' ? size : undefined;

			this.emitMessage({
				type: 'info',
				queryKey: message.queryKey,
				info: { databasePath, databaseSizeBytes, storageType, persisted },
			});
		} catch (error) {
			this.emitMessage({
				type: 'error',
				queryKey: message.queryKey,
				error,
			});
		}
	};

	protected getDatabaseExport = async (
		message: ExportMessage
	): Promise<void> => {
		try {
			const byteArray = this.sqlite3!.capi.sqlite3_js_db_export(this.db!);

			this.emitMessage({
				type: 'export',
				queryKey: message.queryKey,
				export: {
					data: byteArray,
				},
			});
		} catch (error) {
			this.emitMessage({
				type: 'error',
				queryKey: message.queryKey,
				error,
			});
		}
	};

	protected createUserFunction = (message: FunctionMessage): void => {
		const { functionName, functionType, queryKey } = message;
		let func;

		if (this.userFunctions.has(functionName)) {
			this.emitMessage({
				type: 'error',
				error: new Error(
					`A user-defined function with the name "${functionName}" has already been created for this SQLocal instance.`
				),
				queryKey,
			});
			return;
		}

		if (functionType === 'callback') {
			func = (...args: any[]) => {
				this.emitMessage({
					type: 'callback',
					name: functionName,
					args: args,
				});
			};
		} else {
			func = this.proxy[`_sqlocal_func_${functionName}`];
		}

		try {
			this.initUserFunction({
				type: functionType,
				name: functionName,
				func,
			});
			this.emitMessage({
				type: 'success',
				queryKey,
			});
		} catch (error) {
			this.emitMessage({
				type: 'error',
				error,
				queryKey,
			});
		}
	};

	protected initUserFunction = (fn: UserFunction): void => {
		if (!this.db) return;

		this.db.createFunction({
			name: fn.name,
			xFunc: (_: number, ...args: any[]) => fn.func(...args),
			arity: -1,
		});

		this.userFunctions.set(fn.name, fn);
	};

	protected importDb = async (message: ImportMessage): Promise<void> => {
		// TODO implement logic for memory only database...
		if (!this.sqlite3 || this.config.storage?.type !== 'opfs') return;

		const { queryKey, database } = message;

		if (!('opfs' in this.sqlite3)) {
			this.emitMessage({
				type: 'error',
				error: new Error(
					'The origin private file system is not available, so a database cannot be imported. Make sure your web server is configured to use the correct HTTP response headers (See https://sqlocal.dallashoffman.com/guide/setup#cross-origin-isolation).'
				),
				queryKey,
			});
			return;
		}

		try {
			await this.sqlite3.oo1.OpfsDb.importDb(
				this.config.storage.path,
				database
			);
			this.emitMessage({
				type: 'success',
				queryKey,
			});
		} catch (error) {
			this.emitMessage({
				type: 'error',
				error,
				queryKey,
			});
		}
	};

	protected destroy = (message?: DestroyMessage): void => {
		if (this.db) {
			this.db.exec({ sql: 'PRAGMA optimize' });
			this.db.close();
			this.db = undefined;
			this.dbStorageType = undefined;
		}

		if (message) {
			this.emitMessage({
				type: 'success',
				queryKey: message.queryKey,
			});
		}
	};
}
