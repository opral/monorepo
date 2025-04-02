/**
 * Generates a human-readable ID in the format "adjective-noun-000" (e.g., "happy-tiger-042")
 * using random selections from predefined lists of adjectives and nouns, plus a random 3-digit number.
 */
export const generateHumanId = (): string => {
  const adjectives = [
    "happy", "clever", "brave", "bright", "calm", "eager", "gentle", "kind",
    "lively", "neat", "proud", "smart", "swift", "witty", "blue", "green",
    "red", "purple", "orange", "yellow", "teal", "pink", "silver", "golden"
  ];

  const nouns = [
    "apple", "bear", "cat", "dog", "eagle", "fox", "goat", "horse", "iguana",
    "jaguar", "koala", "lion", "mouse", "newt", "owl", "panda", "rabbit",
    "snake", "tiger", "unicorn", "whale", "zebra", "star", "moon", "sun",
    "cloud", "river", "mountain", "forest", "ocean"
  ];

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  return `${randomAdjective}-${randomNoun}-${randomNumber}`;
};