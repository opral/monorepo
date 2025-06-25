# Lists
<!--
TEST REASONING:
This test shows several notable transformations in list formatting:
1. Alternative list markers (* and +) are standardized to hyphens (-)
2. The hierarchy and indentation of lists is preserved, which is crucial
3. Formatting within list items is normalized (same as regular text)
4. Paragraph spacing within list items is maintained

These transformations maintain the semantic structure while improving consistency.
-->

## tc - simple unordered list

- Item 1
- Item 2
- Item 3

## tc - asterisk unordered list

* Alternative item 1
* Alternative item 2
* Alternative item 3

## tc - plus unordered list

+ Another alternative item 1
+ Another alternative item 2
+ Another alternative item 3

## tc - nested unordered lists

- Item 1
  - Nested item 1.1
  - Nested item 1.2
    - Deeply nested item 1.2.1
    - Deeply nested item 1.2.2
  - Nested item 1.3
- Item 2
  - Nested item 2.1
  - Nested item 2.2

## tc - simple ordered list

1. First item
2. Second item
3. Third item

## tc - nested ordered lists

1. First item
   1. Nested item 1.1
   2. Nested item 1.2
      1. Deeply nested item 1.2.1
      2. Deeply nested item 1.2.2
   3. Nested item 1.3
2. Second item
   1. Nested item 2.1
   2. Nested item 2.2

## tc - mixed ordered and unordered lists

1. Ordered item 1
2. Ordered item 2
   - Unordered nested item 2.1
   - Unordered nested item 2.2
     1. Ordered deeply nested item 2.2.1
     2. Ordered deeply nested item 2.2.2
   - Unordered nested item 2.3
3. Ordered item 3

## tc - list items with formatting

- **Bold item**
- *Italic item*
- ~~Strikethrough item~~
- Item with `code`
- Item with [link](https://example.com)
- Item with *nested **formatting***

## tc - list items with paragraphs

- First item

  Paragraph within the first list item.
  
  Another paragraph within the first list item.

- Second item

  Paragraph within the second list item.

## tc - task lists

- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task
- [ ] Another incomplete task

