# Lix Plugin `.csv` 

This plugin adds support for `.csv` files in Lix.

## Limitations 

CSV files have no ids. To detect changes, the CSV plugin assumes that a unique column exists in the CSV file. This column is used to uniquely identify each row in the CSV file. 

- Every CSV file must have a header row.
- The CSV file must have a unique column. 
- Changing the unique column value in a row will lead to the detection of a deletion and new insertion.  

### Valid Example

| Email (unique column)     | Name           | Age |
|---------------------------|----------------|-----|
| hans@example.com          | Hans Müller    | 30  |
| mull@example.com          | Hans Müller    | 83  |
| lisa@example.com          | Lisa Schneider | 25  |
| karl@example.com          | Karl Meier     | 28  |

