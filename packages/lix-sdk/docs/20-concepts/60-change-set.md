# Change Set

## Purpose

Optimized (internal) data structure to point to changes. 

## Description  

Many features require pointing to a set of changes. Versions are a good example. A version points to a set of changes that are applied together.
Change sets allow de-duplication of change pointers. If version A and B point to 100.000 changes each but 90.000 are identical, the change sets
have 90.000 pointers in common. Instead of storing 200.000 pointers (one for each version), only 110.000 pointers are stored (90.000 in common 
and 10.000 each that differ).