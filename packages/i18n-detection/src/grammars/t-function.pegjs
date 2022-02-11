
// `matches` is a variable holding all `Possiblities` or (denoted by `/`)
// any character `.`. The asterix `*` means match multiple times.
//
// Matching any character `.` is required to consume input. Since we only
// care about "actual matches" though, the matches are filtered whether
// they are an object (holding the id and location), or not.
Result = matches:(Possiblities / .)* {
	return matches.filter((match) => typeof match === "object")
}

// a valid (fluent message or attribute) id
Id = chars:([a-z]/[A-Z]/[0-9]/'_'/'-')* {
	// the id is the combination of all characters, hence .join()
	// the location uses the location function from peggy
	// https://peggyjs.org/documentation.html#locations
	return { id: chars.join(""), location: location() }
}

// all possiblities
Possiblities = Possibility1

// [^)]* match any character except ')' multiple times until
// the closing pharantheses ')' is matched.
Possibility1 = 't(' QuotationMark @Id QuotationMark [^)]* ')'

// single quote `'` or double quote `"`
QuotationMark = '"' / "'"
