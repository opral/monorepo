# Emphasis and Strong

<!-- 
TEST REASONING:
Emphasis formatting standardization is visible here. The serializer has normalized
the syntax, preferring underscores (_) for italics rather than asterisks (*).
This is acceptable because the semantic meaning and visual rendering are identical,
and standardizing on one syntax improves consistency throughout the document.
-->

## tc - italic with asterisks

_Italic text_ using single asterisks.

## tc - italic with underscores

_Italic text_ using single underscores.

## tc - bold with asterisks

**Bold text** using double asterisks.

## tc - bold with underscores

**Bold text** using double underscores.

## tc - bold-italic with asterisks

_**Bold and italic**_ using triple asterisks.

## tc - bold-italic with underscores

_**Bold and italic**_ using triple underscores.

## tc - mixed formatting inline - nested

**Bold text with _italic_** **inside**.

## tc - mixed formatting inline - not nested

**Bold text with** _**italic**_ **not nested**.

## tc - italic with bold inside

_Italic text with **bold** inside_.

## tc - strikethrough

~~Strikethrough text~~ using double tildes.

## tc - mixed styles in paragraph

Mixed **bold** and _italic_ and ~~strikethrough~~ in one paragraph.
