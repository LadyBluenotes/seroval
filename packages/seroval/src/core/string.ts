import { NIL } from './constants';

const MIN_JSON_STRINGIFY_LENGTH = 64;

// Every code unit `serializeChar` rewrites. A native scan is far cheaper than
// the character loop, and most strings (object keys above all) need no escape.
const NEEDS_ESCAPE = /["\\\n\r\b\t\f<\u2028\u2029]/;

// JSON escapes these code units differently from Seroval's wire format and
// they cannot be patched afterwards; `<`, U+2028 and U+2029 pass through
// `JSON.stringify` untouched, so they are rewritten on its output instead.
const JSON_ESCAPE_DIFFERENCES =
  // biome-ignore lint/suspicious/noControlCharactersInRegex: Match the control characters that require the existing encoder.
  /[\x00-\x07\x0b\x0e-\x1f\ud800-\udfff]/;

const LESS_THAN = /</g;
const LINE_SEPARATOR = /\u2028/g;
const PARAGRAPH_SEPARATOR = /\u2029/g;

export function serializeChar(str: string): string | undefined {
  switch (str) {
    case '"':
      return '\\"';
    case '\\':
      return '\\\\';
    case '\n':
      return '\\n';
    case '\r':
      return '\\r';
    case '\b':
      return '\\b';
    case '\t':
      return '\\t';
    case '\f':
      return '\\f';
    case '<':
      return '\\x3C';
    case '\u2028':
      return '\\u2028';
    case '\u2029':
      return '\\u2029';
    default:
      return NIL;
  }
}

// Written by https://github.com/DylanPiercey and is distributed under the MIT license.
// Creates a JavaScript double quoted string and escapes all characters
// not listed as DoubleStringCharacters on
// Also includes "<" to escape "</script>" and "\" to avoid invalid escapes in the output.
// http://www.ecma-international.org/ecma-262/5.1/#sec-7.8.4
export function serializeString(str: string): string {
  if (!NEEDS_ESCAPE.test(str)) {
    return str;
  }
  if (
    str.length >= MIN_JSON_STRINGIFY_LENGTH &&
    !JSON_ESCAPE_DIFFERENCES.test(str)
  ) {
    let result = JSON.stringify(str).slice(1, -1);
    // JSON never emits these from an escape, so each one is an original
    // character that still needs Seroval's encoding.
    if (result.includes('<')) {
      result = result.replace(LESS_THAN, '\\x3C');
    }
    if (result.includes('\u2028')) {
      result = result.replace(LINE_SEPARATOR, '\\u2028');
    }
    if (result.includes('\u2029')) {
      result = result.replace(PARAGRAPH_SEPARATOR, '\\u2029');
    }
    return result;
  }
  let result = '';
  let lastPos = 0;
  let replacement: string | undefined;
  for (let i = 0, len = str.length; i < len; i++) {
    replacement = serializeChar(str[i]);
    if (replacement) {
      result += str.slice(lastPos, i) + replacement;
      lastPos = i + 1;
    }
  }
  return result + str.slice(lastPos);
}

function deserializeReplacer(str: string): string {
  switch (str) {
    case '\\\\':
      return '\\';
    case '\\"':
      return '"';
    case '\\n':
      return '\n';
    case '\\r':
      return '\r';
    case '\\b':
      return '\b';
    case '\\t':
      return '\t';
    case '\\f':
      return '\f';
    case '\\x3C':
      return '\x3C';
    case '\\u2028':
      return '\u2028';
    case '\\u2029':
      return '\u2029';
    default:
      return str;
  }
}

export function deserializeString(str: string): string {
  if (typeof str === 'string' && !str.includes('\\')) {
    return str;
  }
  return str.replace(
    /(\\\\|\\"|\\n|\\r|\\b|\\t|\\f|\\u2028|\\u2029|\\x3C)/g,
    deserializeReplacer,
  );
}
