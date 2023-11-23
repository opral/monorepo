# Backwards compatible versioning

> Is this update backwards compatible? 

Inlang's ecosystem uses [ComVer](https://gitlab.com/staltz/comver) for versioning. ComVer has two numbers that can be incremented: Major and Minor. Major indicates a backwards incompatible change, while Minor indicates a 100% backwards compatible change.

```txt
{Major}.{Minor}

1.0     # Major 1, Minor 0
1.1     # Major 1, Minor 1    
1.124   # Major 1, Minor 124

2.0     # Major 2, Minor 0 (backwards incompatible!)
2.1     # Major 2, Minor 1 
2.1344  # Major 2, Minor 1344
```

## Why is inlang using ComVer? 


- Users only care about "can I update this without breaking anything?". 
- Simple for developers too: "Is this update backwards compatible?" -> Yes or No 
- Aligns with git CI/CD software development workflows where patching an old minor version is complicated. 


## Why not SemVer (Semantic Versioning)? 

- SemVer is not designed for applications that auto update.
- The concepts of patches leads to overhead to ecosystem developers. Backporting fixes doesn't suit a git CI/CD workflow.
- Users only care about "can I update this without breaking anything?". Hence, ComVer is a better fit for inlang's ecosystem. 
