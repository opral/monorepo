# Tables

<!--
TEST REASONING:
These serialized tables demonstrate several formatting normalizations:
1. Whitespace within table cells is now consistent
2. Extra padding for alignment may be reduced or standardized
3. Table alignment markers (:---:) are preserved
4. Formatting within cells is maintained but may be normalized (like * to _)
5. Simplified table syntax is converted to standard pipe table format

These changes improve readability and consistency without altering the 
structural meaning or data relationships within the tables.
-->

## tc - basic table

| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1 | Cell 2 | Cell 3 |
| Cell 4 | Cell 5 | Cell 6 |

## tc - table with alignment

| Left-aligned | Center-aligned | Right-aligned |
| :----------- | :------------: | ------------: |
| Left | Center | Right |
| Left | Center | Right |

## tc - table with formatting

| **Bold Header** | _Italic Header_ | ~~Strikethrough Header~~ |
| --------------- | --------------- | ------------------------ |
| **Bold Cell** | _Italic Cell_ | ~~Strikethrough Cell~~ |
| `Code Cell` | [Link](https://example.com) | ![Image](https://example.com/image.jpg) |

## tc - table with empty cells

| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Content |  | Content |
|  | Content |  |
| Content | Content | Content |

## tc - table with varying column width

| Short | Medium Column | Very Long Column Header That Takes Up A Lot Of Space |
| ----- | ------------- | --------------------------------------------------- |
| 1 | Data | Long content that extends across multiple characters |
| 2 | More Data | More long content in this cell |

## tc - table with line breaks

| Header 1 | Header 2 |
| -------- | -------- |
| Line 1<br>Line 2 | Line 1<br>Line 2 |
| Single Line | Single Line |

## tc - table with escaped pipe characters

| Column with \| pipe | Regular column |
| ------------------ | -------------- |
| Data with \| pipe | Regular data |

## tc - simplified table syntax

| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1 | Cell 2 |
| Cell 3 | Cell 4 |