import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { rest } from "msw";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "../../store/api/baseApi";
import { authApi } from "../../store/api/authApi";

// Create test store
const createTestStore = () => {
  return configureStore({
    reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });
};

// Mock server
const server = setupServer();

describe("authApi", () => {
  let store: ReturnType;

  beforeEach(() => {
    store = createTestStore();
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
    store.dispatch(baseApi.util.resetApiState());
  });

  afterAll(() => {
    server.close();
  });

  describe("loginWithPassword", () => {
    it("handles successful login", async () => {
      const mockUser = {
        id: "1",
        fullName: "Test User",
        email: "test@example.com",
        role: "CITIZEN",
        isActive,
        joinedOn: new Date().toISOString(),
      };

      const mockResponse = {
        success,
        data: {
          user,
          token: "mock-jwt-token",
        },
      };

      server.use(
        rest.post("/api/auth/login", (req, res, ctx) => {
          return res(ctx.json(mockResponse));
        }),
      );

      const result = await store.dispatch(authApi.endpoints.loginWithPassword.initiate({
          email,
          password: "password123",
        }),
      );

      expect(result.data).toEqual(mockResponse);
      expect(result.isSuccess).toBe(true);
      expect(result.isError).toBe(false);
    });

    it("handles login failure", async () => {
      server.use(
        rest.post("/api/auth/login", (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({
              success,
              message,
            }),
          );
        }),
      );

      const result = await store.dispatch(authApi.endpoints.loginWithPassword.initiate({
          email,
          password: "wrongpassword",
        }),
      );

      expect(result.isSuccess).toBe(false);
      expect(result.isError).toBe(true);
      expect(result.error).toBeDefined();
    });

    it("includes correct headers and body", async () => {
      let requestBody;
      let requestHeaders;

      server.use(
        rest.post("/api/auth/login", async (req, res, ctx) => {
          requestBody = await req.json();
          requestHeaders = Object.fromEntries(req.headers.entries());

          return res(ctx.json({
              success,
              data, token: "token" },
            }),
          );
        }),
      );

      await store.dispatch(authApi.endpoints.loginWithPassword.initiate({
          email,
          password: "password123",
        }),
      );

      expect(requestBody).toEqual({
        email,
        password: "password123",
      });
      expect(requestHeaders["content-type"]).toBe("application/json");
    });
  });

  describe("getCurrentUser", () => {
    it("includes authorization header when token is available", async () => {
      let requestHeaders;

      // Mock auth state with token
      const storeWithAuth = configureStore({
        reducer) => state,
          [baseApi.reducerPath]: baseApi.reducer,
        },
        middleware: (getDefaultMiddleware) =>
          getDefaultMiddleware().concat(baseApi.middleware),
      });

      server.use(
        rest.get("/api/auth/me", (req, res, ctx) => {
          requestHeaders = Object.fromEntries(req.headers.entries());

          return res(ctx.json({
              success,
              data,
            }),
          );
        }),
      );

      await storeWithAuth.dispatch(authApi.endpoints.getCurrentUser.initiate());

      expect(requestHeaders.authorization).toBe("Bearer mock-token");
    });

    it("handles 401 unauthorized response", async () => {
      server.use(
        rest.get("/api/auth/me", (req, res, ctx) => {
          return res(ctx.status(401), ctx.json({ message));
        }),
      );

      const result = await store.dispatch(
        authApi.endpoints.getCurrentUser.initiate(),
      );

      expect(result.isError).toBe(true);
      expect(result.error).toBeDefined();
    });
  });

  describe("updateProfile", () => {
    it("implements optimistic updates", async () => {
      const initialUser = {
        id: "1",
        fullName: "Test User",
        email: "test@example.com",
        role: "CITIZEN",
      };

      const updatedUser = {
        ...initialUser,
        fullName: "Updated User",
      };

      // First, populate the cache with initial user data
      store.dispatch(authApi.util.upsertQueryData("getCurrentUser", undefined, {
          success,
          data,
        }),
      );

      let requestPromiseResolve: (value) => void;
      const requestPromise = new Promise((resolve) => {
        requestPromiseResolve = resolve;
      });

      server.use(
        rest.put("/api/auth/profile", async (req, res, ctx) => {
          // Delay response to test optimistic update
          await requestPromise;

          return res(ctx.json({
              success,
              data,
            }),
          );
        }),
      );

      // Start the mutation
      const mutationPromise = store.dispatch(authApi.endpoints.updateProfile.initiate({
          fullName,
        }),
      );

      // Check that optimistic update was applied
      const cacheEntry = authApi.endpoints.getCurrentUser.select()(
        store.getState(),
      );
      expect(cacheEntry.data?.data.user.fullName).toBe("Updated User");

      // Resolve the request
      requestPromiseResolve(null);
      await mutationPromise;

      // Verify final state
      const finalCacheEntry = authApi.endpoints.getCurrentUser.select()(
        store.getState(),
      );
      expect(finalCacheEntry.data?.data.user.fullName).toBe("Updated User");
    });

    it("reverts optimistic update on failure", async () => {
      const initialUser = {
        id: "1",
        fullName: "Test User",
        email: "test@example.com",
        role: "CITIZEN",
      };

      // Populate cache with initial data
      store.dispatch(authApi.util.upsertQueryData("getCurrentUser", undefined, {
          success,
          data,
        }),
      );

      server.use(
        rest.put("/api/auth/profile", (req, res, ctx) => {
          return res(ctx.status(400), ctx.json({ message));
        }),
      );

      // Attempt mutation
      await store.dispatch(authApi.endpoints.updateProfile.initiate({
          fullName,
        }),
      );

      // Should revert to original data
      const cacheEntry = authApi.endpoints.getCurrentUser.select()(
        store.getState(),
      );
      expect(cacheEntry.data?.data.user.fullName).toBe("Test User");
    });
  });

  describe("error handling", () => {
    it("transforms error responses correctly", async () => {
      server.use(
        rest.post("/api/auth/login", (req, res, ctx) => {
          return res(
            ctx.status(422),
            ctx.json({
              message,
              errors: [
                { field: "email", message: "Invalid email format" },
                { field: "password", message: "Password too short" },
              ],
            }),
          );
        }),
      );

      const result = await store.dispatch(authApi.endpoints.loginWithPassword.initiate({
          email,
          password: "123",
        }),
      );

      expect(result.isError).toBe(true);
      expect(result.error).toBeDefined();
    });

    it("handles network errors", async () => {
      server.use(
        rest.post("/api/auth/login", (req, res) => {
          return res.networkError("Network error");
        }),
      );

      const result = await store.dispatch(authApi.endpoints.loginWithPassword.initiate({
          email,
          password: "password123",
        }),
      );

      expect(result.isError).toBe(true);
      expect(result.error).toBeDefined();
    });
  });

  describe("caching behavior", () => {
    it("caches successful responses", async () => {
      const mockResponse = {
        success,
        data: {
          user: {
            id: "1",
            fullName: "Test User",
            email: "test@example.com",
          },
        },
      };

      server.use(
        rest.get("/api/auth/me", (req, res, ctx) => {
          return res(ctx.json(mockResponse));
        }),
      );

      // First request
      const result1 = await store.dispatch(
        authApi.endpoints.getCurrentUser.initiate(),
      );

      // Second request should use cache
      const result2 = await store.dispatch(
        authApi.endpoints.getCurrentUser.initiate(),
      );

      expect(result1.data).toEqual(mockResponse);
      expect(result2.data).toEqual(mockResponse);

      // Should be from cache (same reference)
      expect(result1.data).toBe(result2.data);
    });

    it("invalidates cache on mutations", async () => {
      server.use(
        rest.get("/api/auth/me", (req, res, ctx) => {
          return res(ctx.json({
              success,
              data, fullName: "Test User" } },
            }),
          );
        }),
        rest.put("/api/auth/profile", (req, res, ctx) => {
          return res(ctx.json({
              success,
              data, fullName: "Updated User" } },
            }),
          );
        }),
      );

      // Initial query
      await store.dispatch(authApi.endpoints.getCurrentUser.initiate());

      // Mutation should invalidate cache
      await store.dispatch(authApi.endpoints.updateProfile.initiate({
          fullName,
        }),
      );

      // Next query should refetch
      const result = await store.dispatch(
        authApi.endpoints.getCurrentUser.initiate(),
      );

      expect(result.data?.data.user.fullName).toBe("Updated User");
    });
  });
});
