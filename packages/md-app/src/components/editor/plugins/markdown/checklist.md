# blockquotes

## tc - blockquote with link

> This blockquote contains a [link](https://example.com).

## tc - nested blockquotes

> Nested blockquotes:
> > This is a nested blockquote.
> > > This is a deeply nested blockquote.

## tc - blockquote with multiple paragraphs

> Blockquote with multiple paragraphs:
>
> This is the second paragraph in the blockquote.
>
> This is the third paragraph in the blockquote.

## tc - blockquote with other elements

> Blockquote with other elements:
>
> ### Heading in a blockquote
>
> - List item in blockquote
> - Another list item
>
> ```
> Code block in blockquote
> ```

## tc - blockquote after line break

Paragraph with a line break and then a blockquote:
> This blockquote comes after a line break in a paragraph.

# code blocks

## tc - code block with nested backticks

Tick masking does not work:

````
This code block contains triple backticks
```
nested code
```
````

## tc - code block with line breaks

Line breaks are ignored

```
Line 1
Line 2
Line 3

Line 5 (after empty line)
```

# complex document

## tc - text formatting

Plain text paragraphs are the most basic element. This paragraph demonstrates *italic text*, **bold text**, and ***bold italic text***.

You can also use _underscores_ for __emphasis__ and ___both___ if you prefer.

## tc - line breaks

This paragraph has a line break  
created with two trailing spaces.

This one has a line break\
created with a backslash.

## tc - links

[Link with title](https://example.com "Example Website")

<https://example.com> (Automatic link)

<email@example.com> (Email link)

[Reference link][ref]

[ref]: https://example.com "Reference Example"

## tc - images

![Image example](https://example.com/image.jpg "Sample Image")

![Reference image][img-ref]

[img-ref]: https://example.com/ref-image.jpg "Reference Image"

[![Image with link](https://example.com/image.jpg "Click me")](https://example.com)

## tc - task lists

### Task Lists

- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task

## tc - tables in html container

<table>
<tr>
<td>

## Tables

| Header 1 | Header 2 | Header 3 |
| -------- | :------: | -------: |
| Left     | Center   | Right    |
| Cell     | Cell     | Cell     |

| Formatted | Table     | Header   |
| --------- | --------- | -------- |
| *Italic*  | **Bold**  | `Code`   |
| [Link](https://example.com) | ![Image](https://example.com/image.jpg) | > Quote |


</td>
<td>


## Tables
| Header 1| Header 2| Header 3 |
| --- | --- | --- |
| Left| Center| Right |
| Cell| Cell| Cell || Formatted| Table| Header |
| --- | --- | --- |
| _Italic_| **Bold**| `Code` |
| [Link](https://example.com)| 
![Image](https://example.com/image.jpg)
| > Quote |

</td>
</tr>
</table>