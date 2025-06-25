# Empty paragraphs test

<!-- 
TEST REASONING:
Empty paragraphs are crucial for document structure and should be preserved.
However, the serializer may normalize multiple consecutive newlines to a single blank line.
This test verifies how the serializer handles empty paragraphs during the roundtrip process.
-->

Line with content

Another line with content

Multiple empty lines between content

Last line
