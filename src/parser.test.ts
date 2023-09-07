import { TOMLParser } from './parser'; // Update the import path accordingly

describe('TOMLParser', () => {
  describe('takeUntil', () => {
    test('should correctly take characters until the specified character is encountered', () => {
      const tomlString = 'This is a test string.';
      const parser = new TOMLParser(tomlString);
      const result = parser.takeUntil(' ');
      expect(result).toEqual('This');
    });

    test('should return the remaining string if the specified character is not found until the end', () => {
      const tomlString = 'ThisIsAString';
      const parser = new TOMLParser(tomlString);
      const result = parser.takeUntil(' ');
      expect(result).toEqual('ThisIsAString');

      expect(parser.index).toEqual(tomlString.length);
    });
  });

  describe('takeWhile', () => {
    test('should correctly take characters while the predicate is true', () => {
      const tomlString = '12345abc';
      const parser = new TOMLParser(tomlString);
      const result = parser.takeWhile((char) => /\d/.test(char));
      expect(result).toEqual('12345');

      const { index } = parser;
      expect(index).toEqual(5);
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
      const tomlString = 'outer.inner1 = "value1",outer.inner2 = "value2"';
      const parser = new TOMLParser(tomlString);
      const result = parser.parseTableContents(',');
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

    //! Array parse not yet.
    // test('should correctly parse table contents with nested key-value pairs and arrays', () => {
    //   const tomlString = `
    //     tauri = {
    //       version = "1.3.0",
    //       features = [
    //         "api-all",
    //         "icon-ico",
    //         "icon-png",
    //         "system-tray"
    //       ]
    //     }`;

    //   const parser = new TOMLParser(tomlString);
    //   const result = parser.parseTableContents(',');
    //   console.debug('%o', result);

    //   expect(result).toEqual({
    //     tauri: {
    //       version: '1.3.0',
    //       features: ['api-all', 'icon-ico', 'icon-png', 'system-tray'],
    //     },
    //   });
    // });
  });

  //! Unimplemented Array parser yet.
  // describe('parseArrayValue', () => {
  //   test('should correctly parse a simple array', () => {
  //     const tomlString = '[1, 2, 3, 4, 5]';
  //     const parser = new TOMLParser(tomlString);
  //     const result = parser.parseArrayValue();
  //     expect(result).toEqual(['1', '2', '3', '4', '5']);
  //   });

  //   test('should correctly parse an array with mixed data types', () => {
  //     const tomlString = '["a", 1, true, 2.5, null]';
  //     const parser = new TOMLParser(tomlString);
  //     const result = parser.parseArrayValue();
  //     expect(result).toEqual(['"a"', ' 1', ' true', ' 2.5', ' null']);
  //   });

  //   test('should correctly parse an empty array', () => {
  //     const tomlString = '[]';
  //     const parser = new TOMLParser(tomlString);
  //     const result = parser.parseArrayValue();
  //     expect(result).toEqual([]);
  //   });
  // });

  describe('parseStringValue', () => {
    test('should correctly parse a double-quoted string', () => {
      const tomlString = '"This is a double-quoted string"';
      const parser = new TOMLParser(tomlString);
      const result = parser.parseStringValue('"');
      expect(result).toEqual('This is a double-quoted string');
    });

    test('should correctly parse a single-quoted string', () => {
      const tomlString = "'This is a single-quoted string'";
      const parser = new TOMLParser(tomlString);
      const result = parser.parseStringValue("'");
      expect(result).toEqual('This is a single-quoted string');
    });

    test('should handle escaped quotes within a string', () => {
      const tomlString = '"This is a \\"quoted\\" string"';
      const parser = new TOMLParser(tomlString);
      const result = parser.parseStringValue('"');
      expect(result).toEqual('This is a \\"quoted\\" string');
    });

    test('should handle empty strings', () => {
      const tomlString = '""';
      const parser = new TOMLParser(tomlString);
      const result = parser.parseStringValue('"');
      expect(result).toEqual('');
    });
  });

  describe('parseNumberValue', () => {
    test('should parse positive integer without numeric separators', () => {
      const parser = new TOMLParser('42');
      expect(parser.parseNumberValue()).toEqual('42');
    });

    test('should parse positive integer with numeric separators', () => {
      const parser = new TOMLParser('1_000_000');
      expect(parser.parseNumberValue()).toEqual('1_000_000');
    });

    test('should parse negative integer without numeric separators', () => {
      const parser = new TOMLParser('-123');
      expect(parser.parseNumberValue()).toEqual('-123');
    });

    test('should parse negative integer with numeric separators', () => {
      const parser = new TOMLParser('-1_234_567');
      expect(parser.parseNumberValue()).toEqual('-1_234_567');
    });

    test('should parse positive float without numeric separators', () => {
      const parser = new TOMLParser('3.14159');
      expect(parser.parseNumberValue()).toEqual('3.14159');
    });

    test('should parse positive float with numeric separators', () => {
      const parser = new TOMLParser('3.1_4159e-10');
      expect(parser.parseNumberValue()).toEqual('3.1_4159e-10');
    });

    test('should parse negative float without numeric separators', () => {
      const parser = new TOMLParser('-2.71828');
      expect(parser.parseNumberValue()).toEqual('-2.71828');
    });

    test('should parse negative float with numeric separators', () => {
      const parser = new TOMLParser('-2.71_828e+10');
      expect(parser.parseNumberValue()).toEqual('-2.71_828e+10');
    });

    test('should parse hexadecimal number without numeric separators', () => {
      const parser = new TOMLParser('0x1A3');
      expect(parser.parseNumberValue()).toEqual('0x1A3');
    });

    test('should parse hexadecimal number with numeric separators', () => {
      const parser = new TOMLParser('0x1_A3');
      expect(parser.parseNumberValue()).toEqual('0x1_A3');
    });

    test('should throw an error for invalid hexadecimal characters', () => {
      const parser = new TOMLParser('0x1G3');
      expect(() => parser.parseNumberValue()).toThrow('Invalid characters in hexadecimal number.');
    });

    test('should parse special float value "inf"', () => {
      const parser = new TOMLParser('inf');
      expect(parser.parseNumberValue()).toEqual('inf');
    });

    test('should parse special float value "+inf"', () => {
      const parser = new TOMLParser('+inf');
      expect(parser.parseNumberValue()).toEqual('+inf');
    });

    test('should parse special float value "-inf"', () => {
      const parser = new TOMLParser('-inf');
      expect(parser.parseNumberValue()).toEqual('-inf');
    });

    test('should parse special float value "nan"', () => {
      const parser = new TOMLParser('nan');
      expect(parser.parseNumberValue()).toEqual('nan');
    });

    test('should throw an error for unexpected character', () => {
      const parser = new TOMLParser('3.14x');
      expect(() => parser.parseNumberValue()).toThrow('Unknown tailing x. Do you mean 3.14?');
    });
  });
});
