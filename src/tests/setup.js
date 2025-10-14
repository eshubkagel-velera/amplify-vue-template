import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => 'dev'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

global.localStorage = localStorageMock;

// Mock window object
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:5173/',
    origin: 'http://localhost:5173'
  },
  writable: true
});

// Set default environment
process.env.NODE_ENV = 'test';
process.env.VITE_ENVIRONMENT = 'dev';