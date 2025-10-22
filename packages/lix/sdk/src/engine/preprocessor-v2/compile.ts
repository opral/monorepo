import {
	createQueryId,
	SqliteQueryCompiler,
	type RootOperationNode,
} from "kysely";

const compiler = new SqliteQueryCompiler();

export function compile(preprocessed: RootOperationNode): {
	sql: string;
	parameters: Readonly<any[]>;
} {
	return compiler.compileQuery(preprocessed, createQueryId());
}
