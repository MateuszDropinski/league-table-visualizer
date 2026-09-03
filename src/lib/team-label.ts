/** Three actual letters, preserving Polish accents and skipping spaces/punctuation. */
export function firstThreeLetters(name: string): string {
  return (name.normalize('NFC').match(/\p{L}/gu) ?? []).slice(0, 3).join('').toLocaleUpperCase('en-GB')
}
