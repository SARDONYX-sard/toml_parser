/**
 * @param {string} input - input string
 * @return {string[]}  array of strings
 *
 * # Throw Error
 * If exists unclosed pair.
 */
export function splitKeyStr(input: string): string[] {
  const result: string[] = [];
  let index = 0;

  /**
   * - Advances the index "up to" the specified char.
   * - Returns the string that has been read.
   * @param {string} char
   * @return {string} The string that has been read.
   */
  const takeUntil = (char: string): string => {
    let res = '';
    while (index < input.length && char !== input[index]) {
      res += input[index];
      index++;
    }
    return res;
  };

  /**
   * - Advances the index "to just after" the specified char
   * - Returns the string that has been read.
   * @param {string} char
   * @return {string} The string that has been read(e.g. `"hello"`)
   * # Throw Error
   * If no characters are found and you reach the end of the data.
   */
  const takeUntilPair = (char: string): string => {
    index++; // Skip open pair(e.g. `'`)

    let res = '';
    while (char !== input[index]) {
      if (index >= input.length) {
        throw new Error(`Unclosed ${char}`);
      }
      res += input[index];
      index++;
    }

    index++; // Skip clone pair(e.g. `'`)

    return res;
  };

  while (index < input.length) {
    switch (input[index]) {
      case "'":
        result.push(takeUntilPair("'"));
        break; // `.` skipping is done at the last index++ after break
      case '"':
        result.push(takeUntilPair('"'));
        break; // `.` skipping is done at the last index++ after break
      case '\t':
        break;
      case ' ':
        break;
      default:
        result.push(takeUntil('.'));
        break;
    }
    index++; // Skip "." and etc end character.
  }

  return result;
}
