# Optimize for file formats with ids

Lix is designed for file formats that define (stable) ids for entities.

```diff
Entity Foo { 
+  id: string
  text: string
}
```

## Why

- change tracking without stable ids involved heuristics which are error prone and complex to build
- lix anticipates that change control is so valuable that new file formats with stable ids will emerge