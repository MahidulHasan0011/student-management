import { describe, it, expect } from 'vitest';
import {
  assertString,
  assertUuid,
  assertInteger,
  assertNumber,
  assertBoolean,
  assertDate,
  assertDateOrder,
  assertEnum,
  assertArray,
  GENDERS,
} from '../../src/utils/validators.js';

// বাইরের কোনো নির্ভরতা নেই — pure function, সবসময় চলবে।
describe('validators', () => {
  describe('assertString', () => {
    it('trim করে valid string ফেরত দেয়', () => {
      expect(assertString('  hi ', 'name')).toBe('hi');
    });
    it('required খালি হলে throw করে', () => {
      expect(() => assertString('', 'name')).toThrowError(/required/);
      expect(() => assertString(undefined, 'name')).toThrowError(/required/);
    });
    it('optional absent হলে undefined', () => {
      expect(assertString(undefined, 'name', { required: false })).toBeUndefined();
    });
    it('non-string হলে throw', () => {
      expect(() => assertString(123, 'name')).toThrowError(/must be a string/);
    });
    it('min/max length প্রয়োগ করে', () => {
      expect(() => assertString('ab', 'name', { min: 3 })).toThrowError(/at least 3/);
      expect(() => assertString('abcd', 'name', { max: 3 })).toThrowError(/too long/);
    });
    it('statusCode 400 দেয়', () => {
      try {
        assertString(undefined, 'name');
      } catch (e) {
        expect(e.statusCode).toBe(400);
      }
    });
  });

  describe('assertUuid', () => {
    it('valid uuid মেনে নেয়', () => {
      const id = '10000000-0000-0000-0000-000000000001';
      expect(assertUuid(id, 'id')).toBe(id);
    });
    it('invalid uuid throw', () => {
      expect(() => assertUuid('not-a-uuid', 'id')).toThrowError(/valid id/);
    });
  });

  describe('assertInteger', () => {
    it('string "12" coerce করে', () => {
      expect(assertInteger('12', 'age')).toBe(12);
    });
    it('non-integer throw', () => {
      expect(() => assertInteger('12.5', 'age')).toThrowError(/integer/);
    });
    it('min/max প্রয়োগ', () => {
      expect(() => assertInteger(0, 'age', { min: 1 })).toThrowError(/>= 1/);
      expect(() => assertInteger(10, 'age', { max: 5 })).toThrowError(/<= 5/);
    });
  });

  describe('assertNumber', () => {
    it('decimal মেনে নেয়', () => {
      expect(assertNumber('12.5', 'marks')).toBe(12.5);
    });
    it('NaN throw', () => {
      expect(() => assertNumber('abc', 'marks')).toThrowError(/must be a number/);
    });
  });

  describe('assertBoolean', () => {
    it('boolean মেনে নেয়', () => {
      expect(assertBoolean(true, 'flag')).toBe(true);
    });
    it('string "true" মানে না', () => {
      expect(() => assertBoolean('true', 'flag')).toThrowError(/boolean/);
    });
  });

  describe('assertDate / assertDateOrder', () => {
    it('valid date মেনে নেয়', () => {
      expect(assertDate('2026-01-01', 'start')).toBe('2026-01-01');
    });
    it('invalid date throw', () => {
      expect(() => assertDate('not-a-date', 'start')).toThrowError(/invalid/);
    });
    it('start >= end হলে throw', () => {
      expect(() => assertDateOrder('2026-02-01', '2026-01-01')).toThrowError(/must be before/);
    });
    it('ঠিক ক্রমে কোনো error নয়', () => {
      expect(() => assertDateOrder('2026-01-01', '2026-02-01')).not.toThrow();
    });
  });

  describe('assertEnum', () => {
    it('allowed মান মেনে নেয়', () => {
      expect(assertEnum('MALE', 'gender', GENDERS)).toBe('MALE');
    });
    it('বাইরের মান throw', () => {
      expect(() => assertEnum('X', 'gender', GENDERS)).toThrowError(/must be one of/);
    });
  });

  describe('assertArray', () => {
    it('array মেনে নেয়', () => {
      expect(assertArray([1, 2], 'ids')).toEqual([1, 2]);
    });
    it('non-array throw', () => {
      expect(() => assertArray('x', 'ids')).toThrowError(/must be an array/);
    });
    it('খালি array (min 1) throw', () => {
      expect(() => assertArray([], 'ids')).toThrowError(/at least 1/);
    });
  });
});
