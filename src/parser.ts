import { arrayToNestObj, deepMerge, setValueToObject } from './obj_changer';
import { splitKeyStr } from './parse_header';

export type TomlValue = object | Array<string> | string | number | boolean;
type TomlJson = Record<string, TomlValue>;

export class TOMLParser {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: Record<string, any>;
  text: string;
  /** The current position of text does not revert to 0 when a newline character `\n` arrives like `column`. */
  index: number;
  line: number;
  column: number;
  /**
   * Creates an instance of TOMLParser.
   * @param {string} tomlString
   * @memberof TOMLParser
   */
  constructor(tomlString: string) {
    this.result = {};
    this.text = tomlString;
    this.index = 0;
    this.line = 0;
    this.column = 0;
  }

  /**
   * Parse toml
   * @return {*}
   * @memberof TOMLParser
   */
  parse(): unknown {
    while (this.index < this.text.length) {
      const char = this.text[this.index];

      switch (char) {
        case ' ':
        case '\n':
          this.advance();
          break;
        case '[': {
          this.parseTableHeader();
          const keyValuePair = this.parseTableContents();
          this.result = { ...keyValuePair };
          break;
        }
        default:
          throw new Error(`Unexpected character: ${char}
parsed toml: ${JSON.stringify(this.result)}`);
      }
    }

    return this.result;
  }

  /**
   * Parse until `[tableHeaderName]`
   *
   * @private
   * @memberof TOMLParser
   */
  parseTableHeader() {
    this.advance(); // Skip `[`
    const tableHeader = this.takeUntil(']');
    this.advance(); // current index point to `]`, So we Skip `]`

    // remain check for syntax errors
    const remain = this.takeUntil('\n');
    if (remain.trim() !== '') {
      throw new Error(`A newline or EOF is expected after the table header. But got ${remain}`);
    }
    this.advance(); // Skip `\n`

    const parsedTableHeaders = splitKeyStr(tableHeader);
    this.result = arrayToNestObj(parsedTableHeaders);
  }

  /**
   * Parse table contents
   * @param delim - default: `\n`(e.g. `\n`, `,` etc.)
   *
   * - from
   * ```toml
   *   tauri = { version = "1.3.0", features = [
   *   "api-all",
   *   "icon-ico",
   *   "icon-png",
   *   "system-tray",
   * ] }
   * ```
   * - to
   * ```json
   * {
   *   "tauri": {
   *     "version": "1.3.0",
   *     "features": [
   *       "api-all",
   *       "icon-ico",
   *       "icon-png",
   *       "system-tray"
   *     ]
   *   }
   * }
   * ```
   */
  parseTableContents(delim = '\n'): TomlJson {
    // take until next table header symbol.
    let table = {};
    this.takeWhile((char) => {
      this.takeWhile((char) => char === delim);
      // parse key value(e.g. key= value)
      const nestedKeys = splitKeyStr(this.takeUntil('=').trim());
      this.advance(); // Skip `='
      const obj = arrayToNestObj(nestedKeys);
      const value = this.parseValue();
      setValueToObject(obj, nestedKeys, value);
      table = deepMerge(table, obj);
      return char !== '[';
    });

    return table;
  }

  parseValue(): TomlValue {
    while (this.index < this.text.length) {
      const char = this.text[this.index];
      // - `,`: array delimiter.
      if (char === ' ' || char === '\t' || char === ',') {
        this.advance();
      } else if (char === '{') {
        return this.parseTableValue();
      } else if (char === '[') {
        return this.parseArrayValue();
      } else if (char === '"') {
        return this.parseStringValue('"');
      } else if (char === "'") {
        return this.parseStringValue("'");
      } else if (char === 't' || char === 'f') {
        return this.parseBoolValue();
      } else if (!isNaN(Number(char)) || char === '-') {
        return this.parseNumberValue();
      } else {
        throw new Error(`Unexpected character: ${char}`);
      }
    }
  }

  /**
   * Parse table value (e.g. `{ version = "1.27.0", features = ["time", "macros", "rt"] }`)
   *
   * @private
   * @return {*}
   */
  parseTableValue() {
    this.advance(); // Skip `{`
    const res = this.parseTableContents(',');
    this.advance(); // Skip `}`
    return res;
  }

  /**
   * Advance the index, line, and column of TomlParser's this.text by one character.
   *
   * @private
   * @memberof TOMLParser
   */
  private advance() {
    if (this.text[this.index] === '\n') {
      this.line++;
      this.column = 0;
    } else {
      this.column++;
    }
    this.index++;
  }

  parseArrayValue(): Array<TomlValue> {
    const res: Array<TomlValue> = [];
    this.advance(); // Skip opening `[` bracket
    res.push(this.parseValue());
    this.takeUntil(']'); // remove whitespace
    this.advance(); // Skip opening `]` bracket
    return res;
  }

  parseStringValue(pairChar: string): string {
    this.advance(); // Skip opening quote
    let isEscaped = false; //Forced read flag to deal with parsing of "\", \'.
    const res = this.takeWhile((char) => {
      if (char === '\\' && this.text[this.index + 1] === pairChar) {
        isEscaped = true;
        return true;
      } else if (isEscaped) {
        isEscaped = false;
        return true;
      } else {
        return char !== pairChar;
      }
    }); // index now points to the closed quote string.
    this.advance(); // Skip closing quote
    return res;
  }

  parseBoolValue(): boolean {
    return this.takeUntil('\n') === 'true';
  }

  /**
   * Parse a TOML-formatted number value into a JavaScript number.
   *
   * @returns The parsed number string(e.g. "0xFFF", "0o00", "0b1011")
   */
  parseNumberValue(): TomlValue {
    const mayNum = this.takeUntil('\n').trim();

    // Check for a numeric separator at the end and disallow it
    if (mayNum.endsWith('_')) {
      throw new Error('Numeric separator (_) not allowed at the end of a number value.');
    }

    if (mayNum.startsWith('0x')) {
      // Hexadecimal number
      const hexStr = mayNum.slice(2);
      if (/^[\da-fA-F]+(?:_[\da-fA-F]+)*\b/.test(hexStr)) {
        return `0x${hexStr}`;
      }
      throw new Error('Invalid characters in hexadecimal number.');
    } else if (mayNum.startsWith('0o')) {
      // Octal number
      const octalStr = mayNum.slice(2);
      if (/^[0-7]+(?:_[0-7]+)*\b/.test(octalStr)) {
        return `0o${octalStr}`;
      }
      throw new Error('Invalid characters in octal number.');
    } else if (mayNum.startsWith('0b')) {
      // Binary number
      const binaryStr = mayNum.slice(2);
      if (/^[01]+(?:_[01]+)*\b/.test(binaryStr)) {
        return `0b${binaryStr}`;
      }
      throw new Error('Invalid characters in binary number.');
    } else if (/^[-+]?\d+(?:_|\d+)*(?:\.\d+(?:[eE]|[-+]|_|\d+)*)?\b/.test(mayNum)) {
      // This RegExp borrowed from PrismJS
      // MIT LICENSE
      // Copyright (c) 2012 Lea Verou
      // See: https://github.com/PrismJS/prism/pull/1488/files#diff-f262e20be4431bcbc6bb70f9fa7a00ad070d706ed9c4eb7310ee049890a49474R39
      const [, num, remain] = /(^[-+]?\d+(?:_|\d+)*(?:\.\d+(?:[eE]|[-+]|_|\d+)*)?)(.*)/.exec(mayNum);
      if (remain) {
        throw new Error(`Unknown tailing ${remain}. Do you mean ${num}?`);
      }
      return mayNum; // decimal & float
    } else if (mayNum === 'inf' || mayNum === '+inf' || mayNum === '-inf' || mayNum === 'nan') {
      // Special float values
      return mayNum;
    } else {
      throw new Error(`Invalid number format: ${mayNum}`);
    }
  }

  /**
   * - Reads a string up to the argument `char`
   * - After this function, `this.index` points to the position **immediately before** the `char` argument.
   * @param char
   * @returns String up to argument `char`
   */
  takeUntil(char: string): string {
    return this.takeWhile((current_char) => current_char !== char);
  }

  /**
   * - Get the characters while predicate is true
   * - After this function ends, this.index points to the next character.(if predicate conditional is true)
   * @param predicate
   * @returns the characters while predicate is true.
   */
  takeWhile(predicate: (char: string) => boolean): string {
    let value = '';
    while (this.index < this.text.length && predicate(this.text[this.index])) {
      value += this.text[this.index];
      this.advance();
    }
    return value;
  }
}
