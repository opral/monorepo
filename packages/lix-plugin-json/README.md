# Lix Plugin `.json` 

This plugin adds support for `.json` files in Lix.

## Limitations 

The JSON plugin does not track changes within objects in arrays. Instead, it treats the entire array as a single entity.

- The JSON plugin does not require a unique identifier for objects within arrays.
- Any change within an array will be detected as a change to the entire array.
- The plugin does not differentiate between modifications, deletions, or insertions within arrays.

### Valid Example

```json
{
    "apiKey": "your-api-key-here",
    "projectId": "your-project-id-here",
    "settings": {
        "notifications": true,
        "theme": "dark",
        "autoUpdate": false
    },
    "userPreferences": {
        "language": "en",
        "timezone": "UTC"
    }
}
```

