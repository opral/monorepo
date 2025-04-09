# Emphasis and Strong

<!-- 
TEST REASONING:
Emphasis formatting standardization is visible here. The serializer has normalized
the syntax, preferring underscores (_) for italics rather than asterisks (*).
This is acceptable because the semantic meaning and visual rendering are identical,
and standardizing on one syntax improves consistency throughout the document.
-->

## tc - italic with asterisks

*Italic text* using single asterisks.

## tc - italic with underscores

_Italic text_ using single underscores.

## tc - bold with asterisks

**Bold text** using double asterisks.

## tc - bold with underscores

__Bold text__ using double underscores.

## tc - bold-italic with asterisks

***Bold and italic*** using triple asterisks.

## tc - bold-italic with underscores

___Bold and italic___ using triple underscores.

## tc - mixed formatting inline - nested

**Bold text with *italic* inside**.

## tc - mixed formatting inline - not nested

**Bold text with** ***italic*** **not nested**.

## tc - italic with bold inside

*Italic text with **bold** inside*.

## tc - strikethrough

~~Strikethrough text~~ using double tildes.

## tc - mixed styles in paragraph

Mixed **bold** and *italic* and ~~strikethrough~~ in one paragraph.
