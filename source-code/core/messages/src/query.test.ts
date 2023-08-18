/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { createQuery } from "./query.js";
import { queryBaseTests } from "./query.test-util.js";

await queryBaseTests({
	createQueryFn: (messages) => createQuery(messages)
});
