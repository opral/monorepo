// `matches` is a variable holding all `Possiblities` or (denoted by `/`)
// any character `.`. The asterix `*` means match multiple times.
//
// Matching any character `.` is required to consume input. Since we only
// care about "actual matches" though, the matches are filtered whether
// they are an object (holding the id and location), or not.
Result = matches:(Possiblities / .)* {
	return matches.filter((match) => typeof match === "object")
}

// A valid id
//
// Note: The matching pattern is taken from the Fluent spec
//       with one change: Combined message.attrbibute ids
//       such as `login.hello` are matched.
Id = characters:([a-z]/[A-Z]/[0-9]/'_'/'-'/'.')* {
	// the id is the combination of all characters, hence .join()
	// the location uses the location function from peggy
	// https://peggyjs.org/documentation.html#locations
	return { id: characters.join(""), location: location() }
}

// all possiblities
Possiblities = Possibility1

// [^)]* match any character except ')' multiple times until
//       the closing pharantheses ')' is matched.
// [^a-z] do not match if preceeding character is a letter
//        prevents false positives like string.split("id")
Possibility1 = [^a-z] 't(' QuotationMark @Id QuotationMark [^)]* ')'

// single quote `'` or double quote `"`
QuotationMark = '"' / "'"