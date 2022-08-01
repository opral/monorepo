# Converter

## Definition

A converter "converts" a file format to and from the Fluent format.

For a list of existing converters, and thus supported formats, see the [@inlang/fluent-format-converter](https://github.com/inlang/inlang/tree/main/packages/fluent-format-converters) package.

## Context

Inlang is built on top of [Mozilla's Fluent system](https://projectfluent.org). Fluent has its
own file format and syntax. In order to support other formats and syntaxes, converters are
required to parse and serialize those other formats to and from Fluent.
