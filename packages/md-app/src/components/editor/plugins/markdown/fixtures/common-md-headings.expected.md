# Headings

<!--
TEST REASONING:
Notice how alternative heading syntax (using === or ---) is converted to # syntax.
This is an acceptable transformation as it maintains the heading level while
standardizing on a single heading syntax. Also notice that emphasis markers in headings
are normalized to use underscores for italics, consistent with the rest of the document.
-->

## tc - heading level 1

# Heading level 1

## tc - heading level 2

## Heading level 2

## tc - heading level 3

### Heading level 3

## tc - heading level 4

#### Heading level 4

## tc - heading level 5

##### Heading level 5

## tc - heading level 6

###### Heading level 6

## tc - alternative heading level 1

# Alternative Heading level 1

## tc - alternative heading level 2

## Alternative Heading level 2

## tc - heading with emphasis

# Heading with *emphasis*

## tc - heading with strong

## Heading with **strong**

## tc - heading with strikethrough

### Heading with ~~strikethrough~~

## tc - heading with code

#### Heading with `code`

## tc - heading with link

##### Heading with [link](https://example.com)

## tc - heading with mixed formatting

###### Heading with mixed **bold** and *italic*

## tc - heading without blank line after

# Heading followed by paragraph

This is a paragraph right after a heading with no blank line in between. (we expect it to get an extra break)

## tc - heading with trailing whitespace

# Heading with trailing whitespace

Next line content. (we expect it to get an extra break)
