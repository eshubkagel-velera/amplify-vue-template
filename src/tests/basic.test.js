// Basic test to verify vitest is working
import { test, expect, describe } from 'vitest';

describe('Basic Tests', () => {
  test('basic math', () => {
    expect(2 + 2).toBe(4);
    console.log('✅ Basic test passed');
  });
});