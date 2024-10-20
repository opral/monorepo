import type { Result } from "./api.js";
import { expectType } from "tsd";

function foo(): Result<string, Error> {
  return { data: "foo" };
}

const result = foo();

expectType<{ data?: string; error?: Error }>(result);

if (result.error) {
  expectType<Error>(result.error);
  expectType<undefined>(result.data);
} else {
  expectType<undefined>(result.error);
  expectType<string>(result.data);
}
