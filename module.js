// mathUtils.js

// Function to add two numbers
function add(a, b) {
	return a + b
}

// Function to subtract two numbers
function subtract(a, b) {
	return a - b
}

// Function to multiply two numbers
function multiply(a, b) {
	return a * b
}

// Function to divide two numbers
function divide(a, b) {
	if (b === 0) {
		throw new Error("Cannot divide by zero")
	}
	return a / b
}

// Default export: an object containing all the functions
export default {
	add,
	subtract,
	multiply,
	divide,
}

// Named exports
export { add, subtract, multiply, divide }
