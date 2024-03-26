# Collection of known limitations of ISO-git

I (Martin Lysk) openened this file because is stumbled accross variouse limitations when studying the sources of isomorphic git.

### Code smells

 - Iso git uses `4b825dc642cb6eb9a060e54bf8d69288fbee4904` (compare. https://github.com/search?q=repo%3Aisomorphic-git%2Fisomorphic-git%204b825dc642cb6eb9a060e54bf8d69288fbee4904&type=code) in varius spaces. This is the hashcode representing an empty folder in SHA1. Not sure how this behaves with SHA-256 repos? (compare https://stackoverflow.com/questions/9765453/is-gits-semi-secret-empty-tree-object-reliable-and-why-is-there-not-a-symbolic)

 - iso git expects the fs to return files in sorted order - https://github.com/isomorphic-git/isomorphic-git/blob/79a38e017653a4dfe3b93e390bf3ffa73db42e82/src/utils/unionOfIterators.js#L22 - this is done by there own fs wrapper but as soon we want to replace this we have to think about that 

 - iso git support 2gb pack files - https://github.com/isomorphic-git/isomorphic-git/blob/79a38e017653a4dfe3b93e390bf3ffa73db42e82/src/models/GitPackIndex.js#L65


