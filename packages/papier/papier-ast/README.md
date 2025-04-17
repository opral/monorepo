# Papier AST

An interoperable AST for rich text.

- [ ] mentions, images, code blocks
- [ ] parsers and serializers
- [ ] ui components (future)
- [ ] file format (future)

## Goal 

Have a standard rich text AST instead of falling back to markdown, which is unsuited for rich text (been there done that). 

Watch this video https://www.loom.com/share/8ae4a5f864bd42b49353c9fb55bcb312

## Use case

Embedding rich text in UI components like comments, issue trackers, tasks, etc.

## Architecture 

- builds on top of portable text (https://portabletext.org/)
- parsers and serializers to convert between Papier AST and other formats