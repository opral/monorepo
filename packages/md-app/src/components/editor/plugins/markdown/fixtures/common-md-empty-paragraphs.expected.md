# Empty paragraphs test

<!-- 
TEST REASONING:
Empty paragraphs are crucial for document structure and should be preserved.
However, the serializer may normalize multiple consecutive newlines to a single blank line.
This expected output represents the actual serialization behavior, not the ideal behavior.
-->

Line with content

Another line with content

Multiple empty lines between content

Last line