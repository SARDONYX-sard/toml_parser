import { splitKeyStr } from './parse_header';

describe('should be ok to split', () => {
  test('double quotes header', () => {
    expect(splitKeyStr('dog."tater.man"')).toEqual(['dog', 'tater.man']);
  });

  test('contain null double quotes', () => {
    expect(splitKeyStr('dog. "tater.man".""')).toEqual(['dog', 'tater.man', '']);
  });

  test('normal ident after double quotes', () => {
    expect(splitKeyStr('dog. "tater.man".hi')).toEqual(['dog', 'tater.man', 'hi']);
  });

  test('single quotes header', () => {
    expect(splitKeyStr("dog. 'tater.man'")).toEqual(['dog', 'tater.man']);
  });
});

describe('Should throw error', () => {
  test('Unclosed single quote', () => {
    expect(() => splitKeyStr("dog. 'tater.man")).toThrow("Unclosed '");
  });

  test('Unclosed double quote', () => {
    expect(() => splitKeyStr('dog. "tater.man')).toThrow('Unclosed "');
  });
});
