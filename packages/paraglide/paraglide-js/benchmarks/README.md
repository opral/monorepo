# Paraglide Benchmarks

This directory contains benchmark results comparing the bundle size of Paraglide to other i18n libraries.

## Methodology
The benchmarks are using the messages from [obsidian-translations](https://github.com/obsidianmd/obsidian-translations) to attempt to be as realistic as possible.

Each datapoint is produced by setting up a vite-project with the respective library and adding N messages in M languages to the project. The project contains i18n library + messages, as best as possible. The project is then built, minified and gzipped. We measure the size of JS Bundle only.

## Terminology

- **Messages**: A message is a string that is translated into multiple languages. For example, the message `Hello World` is translated into `Hallo Welt` in German.
- **Message Variants**: Is _one_ translation of a message. For example, the message `Hello World` is translated into `Hallo Welt` in German, and `Bonjour le monde` in French. Each of these translations is a message variant. In general, the number of message variants is equal to the number of languages times the number of messages.
