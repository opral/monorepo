/**
 * ---------------- UTILITIES ----------------
 */

import { Static, Type } from "@sinclair/typebox"

const JSONValue = Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
const JSONArray = Type.Array(JSONValue)
// avoiding recursive types in JSON object
const NestedJSONObject = Type.Record(Type.String(), Type.Union([JSONValue, JSONArray]))

export type JSONSerializableObject = Static<typeof JSONSerializableObject>
export const JSONSerializableObject = Type.Record(
	Type.String(),
	Type.Union([JSONValue, JSONArray, NestedJSONObject]),
)

export type JSONSerializable = Static<typeof JSONSerializable>
export const JSONSerializable = Type.Union([JSONSerializableObject, JSONArray, JSONValue])
