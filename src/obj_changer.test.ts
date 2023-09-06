import { deepMerge, setValueToObject } from './obj_changer';

describe('should set value to nested object', () => {
  test('should set nested object', () => {
    const keys = ['dog', 'tater.man', 'hi'];
    const nestedObject = {
      dog: {
        'tater.man': {
          hi: {},
        },
      },
    };
    setValueToObject(nestedObject, keys, 'Hello world!');
    expect(nestedObject.dog['tater.man'].hi).toEqual('Hello world!');
  });

  test('at depth 1', () => {
    const keys = ['dog'];
    const nestedObject = { dog: null };
    setValueToObject(nestedObject, keys, 'Depth 1 Test');
    expect(nestedObject.dog).toEqual('Depth 1 Test');
  });

  test('at depth 2(create if null key)', () => {
    const keys = ['dog', 'tater.man'];
    const nestedObject = {
      dog: {}, // NOTE: "tater.main" is not set
    };
    setValueToObject(nestedObject, keys, 'Depth 2 Test');
    expect(nestedObject.dog['tater.man']).toEqual('Depth 2 Test');
  });

  test('at depth 3(create if null key)', () => {
    const keys = ['dog', 'tater.man', 'hi'];
    const nestedObject = {
      dog: {
        'tater.man': {},
      },
    };
    setValueToObject(nestedObject, keys, 'Depth 3 Test');
    expect(nestedObject.dog['tater.man']['hi']).toEqual('Depth 3 Test');
  });

  test('at depth 4', () => {
    const keys = ['a', 'b', 'c', 'd'];
    const nestedObject = {
      a: {
        b: {
          c: {
            d: {},
          },
        },
      },
    };
    setValueToObject(nestedObject, keys, 'Depth 4 Test');
    expect(nestedObject.a.b.c.d).toEqual('Depth 4 Test');
  });

  test('at depth 6', () => {
    const keys = ['a', 'b', 'c', 'd', 'e', 'f'];
    const nestedObject = {
      a: {
        b: {
          c: {
            d: {
              e: {
                f: {},
              },
            },
          },
        },
      },
    };
    setValueToObject(nestedObject, keys, 'Depth 6 Test');
    expect(nestedObject.a.b.c.d.e.f).toEqual('Depth 6 Test');
  });
});

describe('deepMerge', () => {
  test('should merge two objects deeply', () => {
    const obj1 = { a: 1, b: { c: 2 } };
    const obj2 = { b: { d: 3 }, e: 4 };
    const mergedObj = deepMerge(obj1, obj2);

    // Write your assertions using Jest matchers
    expect(mergedObj).toEqual({ a: 1, b: { c: 2, d: 3 }, e: 4 });
  });

  test('should not modify the original objects', () => {
    const obj1 = { a: 1, b: { c: 2 } };
    const obj2 = { b: { d: 3 }, e: 4 };
    deepMerge(obj1, obj2);

    // Verify that the original objects remain unchanged
    expect(obj1).toEqual({ a: 1, b: { c: 2 } });
    expect(obj2).toEqual({ b: { d: 3 }, e: 4 });
  });

  // Add more test cases for edge cases, empty objects, etc.
});
