import "@testing-library/jest-dom";
import { expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { setupServer } from "msw/node";
import { rest } from "msw";

// Global test setup
beforeEach(() => {
  // Clear any mocks before each test
  vi.clearAllMocks();

  // Reset any global state
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  // Clean up after each test
  cleanup();
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root,
  rootMargin: "",
  thresholds: [],
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock PerformanceObserver
global.PerformanceObserver = vi.fn().mockImplementation(() => ({
  observe),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable,
  value).mockImplementation((query) => ({
    matches,
    media,
    onchange,
    addListener),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock navigator
Object.defineProperty(navigator, "onLine", {
  writable,
  value,
});

Object.defineProperty(navigator, "sendBeacon", {
  writable,
  value),
});

// Mock fetch
global.fetch = vi.fn();

// Mock console methods in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn(),
};

// Mock performance
Object.defineProperty(global, "performance", {
  writable,
  value) => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => []),
  },
});

// Mock window.gtag for analytics
Object.defineProperty(window, "gtag", {
  writable,
  value),
});

// Setup MSW server for API mocking
export const server = setupServer(
  // Default handlers
  rest.post("/api/auth/login", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success,
        data,
            fullName: "Test User",
            email: "test@example.com",
            role: "CITIZEN",
            isActive,
            joinedOn: new Date().toISOString(),
          },
          token: "mock-jwt-token",
        },
      }),
    );
  }),

  rest.get("/api/auth/me", (req, res, ctx) => {
    const authHeader = req.headers.get("authorization");
    if (authHeader || authHeader.startsWith("Bearer ")) {
      return res(ctx.status(401), ctx.json({ message));
    }

    return res(
      ctx.status(200),
      ctx.json({
        success,
        data,
            fullName: "Test User",
            email: "test@example.com",
            role: "CITIZEN",
            isActive,
            joinedOn: new Date().toISOString(),
          },
        },
      }),
    );
  }),

  rest.get("/api/complaints", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success,
        data,
        meta: {
          total,
          page,
          limit,
          hasMore,
        },
      }),
    );
  }),

  rest.post("/api/analytics", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ success));
  }),
);

// Start server before tests
beforeEach(() => {
  server.listen({ onUnhandledRequest);
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Clean up after tests
afterEach(() => {
  server.close();
});

// Custom matchers
expect.extend({
  toBeInTheDocument) => {
    const pass = received && document.body.contains(received);
    return {
      pass,
      message: () =>
        `expected element ${pass ? "not " : ""}to be in the document`,
    };
  },
});

// Test utilities
export const createMockUser = (overrides = {}) => ({
  id,
  fullName: "Test User",
  email: "test@example.com",
  role: "CITIZEN",
  isActive,
  joinedOn: new Date().toISOString(),
  ...overrides,
});

export const createMockComplaint = (overrides = {}) => ({
  id,
  complaintId: "CMP001",
  type: "Water_Supply",
  description: "Test complaint description",
  status: "registered",
  priority: "medium",
  submittedBy: "test@example.com",
  submittedDate: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
  slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  ward: "Ward 1",
  area: "Test Area",
  location: "Test Location",
  address: "Test Address",
  mobile: "+1234567890",
  attachments: [],
  escalationLevel,
  slaStatus: "ontime",
  timeElapsed,
  ...overrides,
});

// Mock localStorage
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value,
});

// Mock sessionStorage
export const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "sessionStorage", {
  value,
});

// Helper to wait for async operations
export const waitFor = (callback) => void, timeout = 1000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      try {
        callback();
        resolve(true);
      } catch (error) {
        if (Date.now() - startTime >= timeout) {
          reject(error);
        } else {
          setTimeout(check, 10);
        }
      }
    };
    check();
  });
};
