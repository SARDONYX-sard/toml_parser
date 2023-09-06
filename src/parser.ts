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
    this.advance(); // Skip `]`

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
  parseTableContents(): TomlJson {
    // take until next table header symbol.
    let table = {};
    this.takeWhile((char) => {
      // parse key value(e.g. key= value)
      const nestedKeys = splitKeyStr(this.takeUntil('=').trim());
      this.advance(); // Skip `=`
      const obj = arrayToNestObj(nestedKeys);
      const value = this.parseValue();
      setValueToObject(obj, nestedKeys, value);
      table = deepMerge(table, obj);
      this.takeWhile((char) => char === '\n' || char === ',');
      return char !== '[';
    });

    return table;
  }

  parseValue(): TomlValue {
    while (this.index < this.text.length) {
      const char = this.text[this.index];
      if (char === ' ' || char === '\t') {
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
      } else if (!Number.isNaN(char) || char === '-') {
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
   * @memberof TOMLParser
   */
  parseTableValue() {
    this.advance(); // Skip `{`
    const res = this.parseTableContents();
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
    const start = this.index;
    let depth = 1;

    while (depth > 0) {
      this.advance();
      const char = this.text[this.index];

      if (char === '[') {
        depth++;
      } else if (char === ']') {
        depth--;
      }
    }
    return this.text.slice(start, this.index + 1).split(',');
  }

  parseStringValue(pairChar: string): string {
    this.advance(); // Skip opening quote
    return this.takeUntil(pairChar); // index now points to the closed quote string.
  }

  parseBoolValue(): boolean {
    const boolStr = this.takeWhile((char) => /[a-zA-Z]/.test(char));
    return boolStr === 'true';
  }

  /**
   * Parse a TOML-formatted number value into a JavaScript number.
   *
   * @returns The parsed number string(e.g. "0xFFF", "0o00", "0b1011")
   */
  parseNumberValue(): string {
    const isHex = () => this.text[this.index] === '0' && this.text[this.index + 1] === 'x';
    const isOctal = () => this.text[this.index] === '0' && this.text[this.index + 1] === 'o';
    const isBinary = () => this.text[this.index] === '0' && this.text[this.index + 1] === 'b';

    if (isHex()) {
      this.advance(); // Skip '0'
      this.advance(); // Skip 'x'
      const hexStr = this.takeWhile((char) => /[0-9a-fA-F]/.test(char));
      return `0x${hexStr}`;
    } else if (isOctal()) {
      this.advance(); // Skip '0'
      this.advance(); // Skip 'o'
      const octalStr = this.takeWhile((char) => /[0-7]/.test(char));
      return `0o${octalStr}`;
    } else if (isBinary()) {
      this.advance(); // Skip '0'
      this.advance(); // Skip 'b'
      const binaryStr = this.takeWhile((char) => /[0-1]/.test(char));
      return `0b${binaryStr}`;
    } else {
      return this.takeWhile((char) => /[0-9.eE+-]/.test(char));
    }
  }

  /**
   *
   * @param {string} char
   * @return {string} String
   * @memberof TOMLParser
   */
  takeUntil(char: string): string {
    return this.takeWhile((current_char) => current_char !== char);
  }

  takeWhile(predicate: (char: string) => boolean): string {
    let value = '';
    while (this.index < this.text.length && predicate(this.text[this.index])) {
      value += this.text[this.index];
      this.advance();
    }
    return value;
  }
}
