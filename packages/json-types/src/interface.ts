import { type Static, Type } from "@sinclair/typebox";

/**
 * ----------- DEEP NESTING UTILITIES -----------
 *
 * The following types are used to create a JSON schema that allows for
 * deep nesting. Otherwise, infinite recursion would occur.
 */

const JSONValue1 = Type.Union([
  Type.String(),
  Type.Number(),
  Type.Boolean(),
  Type.Null(),
]);
const JSONArray1 = Type.Array(JSONValue1);
const JSONObject1 = Type.Record(
  Type.String(),
  Type.Union([JSONArray1, JSONValue1]),
);

const JSONValue2 = Type.Union([JSONValue1, JSONObject1]);
const JSONArray2 = Type.Array(JSONValue2);
const JSONObject2 = Type.Record(
  Type.String(),
  Type.Union([JSONValue2, JSONArray2]),
);

const JSONValue3 = Type.Union([JSONValue2, JSONObject2]);
const JSONArray3 = Type.Array(JSONValue3);
const JSONObject3 = Type.Record(
  Type.String(),
  Type.Union([JSONValue3, JSONArray3]),
);

const JSONValue4 = Type.Union([JSONValue3, JSONObject3]);
const JSONArray4 = Type.Array(JSONValue4);
const JSONObject4 = Type.Record(
  Type.String(),
  Type.Union([JSONValue4, JSONArray4]),
);

// ------------ ACTUAL TYPES ------------

export type JSONObject = Static<typeof JSONObject>;
export const JSONObject = JSONObject4;

export type JSON = Static<typeof JSON>;
export const JSON = Type.Union([JSONObject4, JSONValue4, JSONArray4]);
