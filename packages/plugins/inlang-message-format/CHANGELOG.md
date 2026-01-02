# @inlang/plugin-message-format

## 4.0.0

### Major Changes

- 0b829f8: Support for nesting of message keys

  ```json
  //messages/en.json
  {
  	"hello_world": "Hello World!",
  	"greeting": "Good morning {name}!",
  	"nested": {
  		"key": "Nested key"
  	}
  }
  ```

  **BREAKING**

  Complex messages that have variants need to be wrapped in an array to be distinguished from nested keys.

  ```diff
  //messages/en.json
  {
    "hello_world": "Hello World!",
  +  "complex_message": [
      {
        "declarations": ["input count", "local countPlural = count: plural"],
        "selectors": ["countPlural"],
        "match": {
          "countPlural=one": "There is one item",
          "countPlural=other": "There are {count} items"
        }
      }
  +  ]
  }
  ```

### Minor Changes

- 2d823c8: allow arbitrary message bundle keys https://github.com/opral/inlang-paraglide-js/issues/285

## 3.2.1

### Patch Changes

- b9442e3: - update `exportFiles` to emit sorted output to have less diff noise

## 3.2.0

### Minor Changes

- ff871c4: add support for local variable options and persists selectors

## 3.1.1

### Patch Changes

- 8132942: feat: support array of paths for pathPattern in inlang-message-format plugin

  ```diff
  // settings.json

  {
    "plugin.inlang.messageFormat": {
  +    pathPattern: ["/defaults/{locale}.json", "/translations/{locale}.json"],
    }
  }

  ```

## 3.1.0

### Minor Changes

- 4adfd4d: re-enables adding the `$schema` key to exported files

  the `$schema` prop enables IDEs to provide autocompletion and type checking for the message files

### Patch Changes

- 997f55b: update the fileschema for to variants

  closes https://github.com/opral/inlang-paraglide-js/issues/319

## 3.0.3

### Patch Changes

- fix: re-add `loadMessages` and `saveMessages` again for backwards compatibility

## 3.0.2

### Patch Changes

- add `displayName` and `description` for backwards compatibility

## 3.0.1

### Patch Changes

- added old `loadMessages` and `saveMessages` functions for backwards compatibility

## 3.0.0

### Major Changes

- upgrade to @inlang/sdk v2 beta

## 2.2.0

### Minor Changes

- 732430d: Error on messages file json parse failures

## 2.1.1

### Patch Changes

- 4837297: File locking for concurrent message updates through the load/store plugin api
  Auto-generated human-IDs and aliases - only with experimental: { aliases: true }

## 2.1.0

### Minor Changes

- 0c272619a: types loosened to allow for new/unknown properties

## 2.0.0

### Major Changes

- ca96a2461: The message format is now human readable and can be edited manually. The plugin will automatically convert the message format to the internal format.

  1. Add a filePathPattern property to the inlang project

  ```diff
  "plugin.inlang.messageFormat": {
    "filePath": "./src/messages.json",
  +  "pathPattern": "./messages/{languageTag}.json"
  }
  ```

  2. Run `npx paraglide-js compile`

  The compile command will automatically convert existing messages from the `messages.json` file to the new format.

  3. Delete the `messages.json` and `filePath` property in the inlang project

  ```diff
  "plugin.inlang.messageFormat": {
  -  "filePath": "./src/messages.json",
    "pathPattern": "./messages/{languageTag}.json"
  }
  ```

## 1.4.0

### Minor Changes

- c4afa50ca: fix: don't rely on { recursive: true } as the implemention differs per environment

## 1.3.0

### Minor Changes

- 3016bfab8: improve: use new `settingsSchema` property for plugins to provide a shorter feedback loop when the settings are invalid.
- 1d0d7fa05: fix: https://github.com/opral/inlang/issues/1530

## 1.2.0

### Minor Changes

- 091db828e: fix: don't rely on { recursive: true } as the implemention differs per environment

## 1.1.0

### Minor Changes

- 79c809c8f: improve: the plugin is able to create directories if a the storage file does not exist yet.

  If a user initializes a new project that uses `./.inlang/plugin.inlang.messageFormat/messages.json` as path but the path does not exist yet, the plugin will now create all directories that are non-existend of the path yet and the `messages.json` file itself. This improvement makes getting started with the plugin easier.
