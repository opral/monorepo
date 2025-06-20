[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / LixChangeSetEdgeSchema

# Variable: LixChangeSetEdgeSchema

> `const` **LixChangeSetEdgeSchema**: `object`

Defined in: [packages/lix-sdk/src/change-set/schema.ts:184](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/change-set/schema.ts#L184)

## Type declaration

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

### properties

> `readonly` **properties**: `object`

#### properties.child\_id

> `readonly` **child\_id**: `object`

#### properties.child\_id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.parent\_id

> `readonly` **parent\_id**: `object`

#### properties.parent\_id.type

> `readonly` **type**: `"string"` = `"string"`

### required

> `readonly` **required**: readonly \[`"parent_id"`, `"child_id"`\]

### type

> `readonly` **type**: `"object"` = `"object"`

### x-lix-foreign-keys

> `readonly` **x-lix-foreign-keys**: `object`

#### x-lix-foreign-keys.child\_id

> `readonly` **child\_id**: `object`

#### x-lix-foreign-keys.child\_id.property

> `readonly` **property**: `"id"` = `"id"`

#### x-lix-foreign-keys.child\_id.schemaKey

> `readonly` **schemaKey**: `"lix_change_set"` = `"lix_change_set"`

#### x-lix-foreign-keys.parent\_id

> `readonly` **parent\_id**: `object`

#### x-lix-foreign-keys.parent\_id.property

> `readonly` **property**: `"id"` = `"id"`

#### x-lix-foreign-keys.parent\_id.schemaKey

> `readonly` **schemaKey**: `"lix_change_set"` = `"lix_change_set"`

### x-lix-key

> `readonly` **x-lix-key**: `"lix_change_set_edge"` = `"lix_change_set_edge"`

### x-lix-primary-key

> `readonly` **x-lix-primary-key**: readonly \[`"parent_id"`, `"child_id"`\]

### x-lix-version

> `readonly` **x-lix-version**: `"1.0"` = `"1.0"`
