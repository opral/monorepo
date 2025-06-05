/**
 * Test to verify that the getBlockText function works correctly with Plate elements
 */

import { NodeApi } from "@udecode/plate";

// Mock a simple Plate element structure
const mockPlateElement = {
	type: "p",
	children: [{ text: "Hello " }, { text: "World", bold: true }, { text: "!" }],
};

// This demonstrates how NodeApi.string extracts text from Plate elements
function testGetBlockText(element: any): string {
	try {
		return NodeApi.string(element) || "";
	} catch {
		if (element?.text) {
			return element.text;
		}
		return "";
	}
}

// Test the function
console.log("Testing text extraction:");
console.log("Element:", JSON.stringify(mockPlateElement, null, 2));
console.log("Extracted text:", `"${testGetBlockText(mockPlateElement)}"`);

// The result should be "Hello World!" - combining all text nodes
