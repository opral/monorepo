# The easiest "storage" plugin for inlang

- [x] official inlang message format
- [x] simple to manually edit 
- [x] typesafe via JSON schema

`messages/en.json`

```json
{
  "hello": "Hello {name}!"
}
```

`messages/de.json`

```json
{
  "hello": "Guten Tag {name}!"
}
```

## Settings

### `pathPattern`

The path pattern is used to find the files that contain the messages. 


```json
{
  "pathPattern": "./messages/{languageTag}.json"
}
```


## Syntax

### Variable References

```json
{
  "hello": "Hello {name}!"
}
```

## Pricing 

<doc-pricing></doc-pricing>