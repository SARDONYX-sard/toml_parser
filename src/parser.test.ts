import { TOMLParser } from './parser'; // Update the import path accordingly

describe('takeUntil', () => {
  test('should correctly take characters until the specified character is encountered', () => {
    const tomlString = 'This is a test string.';
    const parser = new TOMLParser(tomlString);
    const result = parser.takeUntil(' ');
    expect(result).toEqual('this');
  });

  test('should return the remaining string if the specified character is not found until the end', () => {
    const tomlString = 'ThisIsAString';
    const parser = new TOMLParser(tomlString);
    const result = parser.takeUntil(' ');
    expect(result).toEqual('ThisIsAString');
  });
});

describe('takeWhile', () => {
  test('should correctly take characters while the predicate is true', () => {
    const tomlString = '12345abc';
    const parser = new TOMLParser(tomlString);
    const result = parser.takeWhile((char) => /\d/.test(char));
    expect(result).toEqual('12345');
  });

  test('should return an empty string if the first character does not satisfy the predicate', () => {
    const tomlString = 'abc12345';
    const parser = new TOMLParser(tomlString);
    const result = parser.takeWhile((char) => /\d/.test(char));
    expect(result).toEqual('');
  });
});

describe('parseTableHeader', () => {
  test('should correctly parse a simple table header', () => {
    const tomlString = '[table1]';
    const parser = new TOMLParser(tomlString);
    parser.parseTableHeader();
    const { result } = parser;
    expect(result).toEqual({ table1: {} });
  });

  test('should correctly parse a nested table header', () => {
    const tomlString = '[table1.sub_table]\nkey="value"';
    const parser = new TOMLParser(tomlString);
    parser.parseTableHeader();
    const { result } = parser;
    expect(result).toEqual({ table1: { sub_table: {} } });
  });

  test('[Err]should throw an error for an invalid table header', () => {
    const invalidStr = ']'; // Yes, Error ocurred because unclosed pair.
    const tomlString = `[table1.invalid]${invalidStr}`;
    const parser = new TOMLParser(tomlString);
    expect(() => parser.parseTableHeader()).toThrow(
      `A newline or EOF is expected after the table header. But got ${invalidStr}`,
    );
  });
});

describe('parseTableContents', () => {
  test('should correctly parse table contents with key-value pairs', () => {
    const tomlString = 'key1 = "value1"\nkey2 = "value2"';
    const parser = new TOMLParser(tomlString);
    const result = parser.parseTableContents();
    expect(result).toEqual({ key1: 'value1', key2: 'value2' });
  });

  test('should correctly parse nested key-value pairs', () => {
    const tomlString = 'outer.inner1 = "value1"\nouter.inner2 = "value2"';
    const parser = new TOMLParser(tomlString);
    const result = parser.parseTableContents();
    expect(result).toEqual({
      outer: {
        inner1: 'value1',
        inner2: 'value2',
      },
    });
  });

  test('should correctly parse an empty table', () => {
    const tomlString = '';
    const parser = new TOMLParser(tomlString);
    const result = parser.parseTableContents();
    expect(result).toEqual({});
  });

  test('should correctly parse table contents with nested key-value pairs and arrays', () => {
    const tomlString = `
        tauri = {
          version = "1.3.0",
          features = [
            "api-all",
            "icon-ico",
            "icon-png",
            "system-tray"
          ]
        }`;

    const parser = new TOMLParser(tomlString);
    const result = parser.parseTableContents();
    console.debug('%o', result);

    expect(result).toEqual({
      tauri: {
        version: '1.3.0',
        features: ['api-all', 'icon-ico', 'icon-png', 'system-tray'],
      },
    });
  });
});
