# diff3

## Usage
```js
var diff3Merge = require('diff3');
var a = ['a', 'text', 'file'];
var o = ['a', 'test', 'file'];
var b = ['a', 'toasty', 'filtered', 'file'];
var diff3 = diff3Merge(a, o, b);
```

## Output
```JSON
[{
    "ok": ["a"]
}, {
    "conflict": {
        "a": ["text"],
        "aIndex": 1,
        "o": ["test"],
        "oIndex": 1,
        "b": ["toasty", "filtered"],
        "bIndex": 1
    }
}, {
    "ok": ["file"]
}]
```
