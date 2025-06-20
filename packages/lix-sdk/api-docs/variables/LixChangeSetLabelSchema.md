[**@lix-js/sdk**](../README.md)

***

[@lix-js/sdk](../README.md) / LixChangeSetLabelSchema

# Variable: LixChangeSetLabelSchema

> `const` **LixChangeSetLabelSchema**: `object`

Defined in: [packages/lix-sdk/src/change-set/schema.ts:214](https://github.com/opral/monorepo/blob/3bcc1f95be292671fbdc30a84e807512030f233b/packages/lix-sdk/src/change-set/schema.ts#L214)

## Type declaration

### additionalProperties

> `readonly` **additionalProperties**: `false` = `false`

### properties

> `readonly` **properties**: `object`

#### properties.change\_set\_id

> `readonly` **change\_set\_id**: `object`

#### properties.change\_set\_id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.label\_id

> `readonly` **label\_id**: `object`

#### properties.label\_id.type

> `readonly` **type**: `"string"` = `"string"`

#### properties.metadata

> `readonly` **metadata**: `object`

#### properties.metadata.nullable

> `readonly` **nullable**: `true` = `true`

#### properties.metadata.type

> `readonly` **type**: `"object"` = `"object"`

### required

> `readonly` **required**: readonly \[`"change_set_id"`, `"label_id"`\]

### type

> `readonly` **type**: `"object"` = `"object"`

### x-lix-foreign-keys

> `readonly` **x-lix-foreign-keys**: `object`

#### x-lix-foreign-keys.change\_set\_id

> `readonly` **change\_set\_id**: `object`

#### x-lix-foreign-keys.change\_set\_id.property

> `readonly` **property**: `"id"` = `"id"`

#### x-lix-foreign-keys.change\_set\_id.schemaKey

> `readonly` **schemaKey**: `"lix_change_set"` = `"lix_change_set"`

#### x-lix-foreign-keys.label\_id

> `readonly` **label\_id**: `object`

#### x-lix-foreign-keys.label\_id.property

> `readonly` **property**: `"id"` = `"id"`

#### x-lix-foreign-keys.label\_id.schemaKey

> `readonly` **schemaKey**: `"lix_label"` = `"lix_label"`

### x-lix-key

> `readonly` **x-lix-key**: `"lix_change_set_label"` = `"lix_change_set_label"`

### x-lix-primary-key

> `readonly` **x-lix-primary-key**: readonly \[`"change_set_id"`, `"label_id"`\]

### x-lix-version

> `readonly` **x-lix-version**: `"1.0"` = `"1.0"`
