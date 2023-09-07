# TOML parser (Uncompleted yet)

## How to use

```javascript
const tomlString = '"This is a \\"quoted\\" string"';
const parser = new TOMLParser(tomlString);
const result = parser.parseStringValue('"');
console.assert(result === '"This is a \\"quoted\\" string');
```
