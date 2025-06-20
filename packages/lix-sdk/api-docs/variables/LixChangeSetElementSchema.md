[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / LixChangeSetElementSchema

# Variable: LixChangeSetElementSchema

> `const` **LixChangeSetElementSchema**: `object`

Defined in: [packages/lix-sdk/src/change-set/schema.ts:109](https://github.com/opral/monorepo/blob/fb8153a2c5d4710eaaabf056fe653be88060a185/packages/lix-sdk/src/change-set/schema.ts#L109)

## Type declaration

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

### properties

> `readonly` **properties**: `object`

#### properties.change\_id

> `readonly` **change\_id**: `object`

#### properties.change\_id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.change\_set\_id

> `readonly` **change\_set\_id**: `object`

#### properties.change\_set\_id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.entity\_id

> `readonly` **entity\_id**: `object`

#### properties.entity\_id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.file\_id

> `readonly` **file\_id**: `object`

#### properties.file\_id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.schema\_key

> `readonly` **schema\_key**: `object`

#### properties.schema\_key.type

> `readonly` **type**: `"string"` = `"string"`

### required

> `readonly` **required**: readonly \[`"change_set_id"`, `"change_id"`, `"entity_id"`, `"schema_key"`, `"file_id"`\]

### type

> `readonly` **type**: `"object"` = `"object"`

### x-lix-foreign-keys

> `readonly` **x-lix-foreign-keys**: `object`

#### x-lix-foreign-keys.change\_id

> `readonly` **change\_id**: `object`

#### x-lix-foreign-keys.change\_id.property

> `readonly` **property**: `"id"` = `"id"`

#### x-lix-foreign-keys.change\_id.schemaKey

> `readonly` **schemaKey**: `"lix_change"` = `"lix_change"`

#### x-lix-foreign-keys.change\_set\_id

> `readonly` **change\_set\_id**: `object`

#### x-lix-foreign-keys.change\_set\_id.property

> `readonly` **property**: `"id"` = `"id"`

#### x-lix-foreign-keys.change\_set\_id.schemaKey

> `readonly` **schemaKey**: `"lix_change_set"` = `"lix_change_set"`

#### x-lix-foreign-keys.schema\_key

> `readonly` **schema\_key**: `object`

#### x-lix-foreign-keys.schema\_key.property

> `readonly` **property**: `"key"` = `"key"`

#### x-lix-foreign-keys.schema\_key.schemaKey

> `readonly` **schemaKey**: `"lix_stored_schema"` = `"lix_stored_schema"`

### x-lix-key

> `readonly` **x-lix-key**: `"lix_change_set_element"` = `"lix_change_set_element"`

### x-lix-primary-key

> `readonly` **x-lix-primary-key**: readonly \[`"change_set_id"`, `"change_id"`\]

### x-lix-unique

> `readonly` **x-lix-unique**: readonly \[readonly \[`"change_set_id"`, `"entity_id"`, `"schema_key"`, `"file_id"`\]\]

### x-lix-version

> `readonly` **x-lix-version**: `"1.0"` = `"1.0"`
