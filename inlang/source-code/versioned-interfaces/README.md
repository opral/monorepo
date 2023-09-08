# Versioned interfaces

## What is a versioned interface?

An interface that is versioned independently from implementation(s).  

## When to create a versioned interface?

When the interface is: 

- the interface is expected to change/have breaking changes in the future
- used independently from implementation(s) (think of a Plugin interface which is used without knowing the implementation)
- exposed to external developers 
- used by more than one implementation 