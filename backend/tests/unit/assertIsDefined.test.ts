import { assertIsDefined } from '../../src/util/assertIsDefined';
test('accepts a defined object', () => {
  expect(() => assertIsDefined({ id: 'a' })).not.toThrow();
});
test.each([null, undefined])('rejects %s', (value) => {
  expect(() => assertIsDefined(value)).toThrow("Expected 'val' to be defined");
});
// Current implementation rejects every falsy value, including 0 and false.
// Do not describe this helper as a general null-only validator.
