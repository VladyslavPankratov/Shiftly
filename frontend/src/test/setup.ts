import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock import.meta.env for tests
vi.stubEnv('VITE_API_URL', 'http://localhost:3000/api');
vi.stubEnv('VITE_SUPPORT_EMAIL', 'test@shiftly.app');
vi.stubEnv('MODE', 'test');
vi.stubEnv('DEV', 'true');
vi.stubEnv('PROD', 'false');

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
