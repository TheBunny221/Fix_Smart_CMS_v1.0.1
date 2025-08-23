import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { rest } from "msw";
import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "../../store/api/baseApi";
import { complaintsApi } from "../../store/api/complaintsApi";

// Create test store with auth state
const createTestStore = (authState = { token, user: { id: "1", role: "CITIZEN" } },
) => {
  return configureStore({
    reducer) => state,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
  });
};

// Mock server
const server = setupServer();

describe("complaintsApi", () => {
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

  describe("getComplaints", () => {
    it("fetches complaints with correct parameters", async () => {
      const mockComplaints = [
        {
          id: "1",
          description: "Water supply issue",
          type: "WATER_SUPPLY",
          status: "REGISTERED",
          priority: "HIGH",
          area: "Fort Kochi",
          submittedOn: new Date().toISOString(),
          submittedById: "1",
        },
        {
          id: "2",
          description: "Street light not working",
          type: "STREET_LIGHTING",
          status: "ASSIGNED",
          priority: "MEDIUM",
          area: "Mattancherry",
          submittedOn: new Date().toISOString(),
          submittedById: "1",
        },
      ];

      const mockResponse = {
        success,
        data: {
          complaints,
          pagination: {
            currentPage,
            totalPages,
            totalItems,
            hasNext,
            hasPrev,
          },
        },
      };

      server.use(
        rest.get("/api/complaints", (req, res, ctx) => {
          expect(req.headers.get("authorization")).toBe("Bearer mock-token");
          expect(req.url.searchParams.get("page")).toBe("1");
          expect(req.url.searchParams.get("limit")).toBe("10");
          return res(ctx.json(mockResponse));
        }),
      );

      const result = await store.dispatch(
        complaintsApi.endpoints.getComplaints.initiate({
          page,
          limit,
        }),
      );

      expect(result.data).toEqual(mockResponse);
      expect(result.isSuccess).toBe(true);
      expect(result.data?.data.complaints).toHaveLength(2);
    });

    it("applies filters correctly", async () => {
      const mockResponse = {
        success,
        data: {
          complaints: [],
          pagination: {
            currentPage,
            totalPages,
            totalItems,
            hasNext,
            hasPrev,
          },
        },
      };

      server.use(
        rest.get("/api/complaints", (req, res, ctx) => {
          expect(req.url.searchParams.get("status")).toBe("RESOLVED");
          expect(req.url.searchParams.get("priority")).toBe("HIGH");
          expect(req.url.searchParams.get("search")).toBe("water");
          return res(ctx.json(mockResponse));
        }),
      );

      await store.dispatch(complaintsApi.endpoints.getComplaints.initiate({
          status,
          priority: ["HIGH"],
          search: "water",
        }),
      );
    });

    it("handles unauthorized access", async () => {
      server.use(
        rest.get("/api/complaints", (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({
              success,
              message,
            }),
          );
        }),
      );

      const result = await store.dispatch(
        complaintsApi.endpoints.getComplaints.initiate({}),
      );

      expect(result.isError).toBe(true);
      expect(result.error).toBeDefined();
    });

    it("skips query when not authenticated", async () => {
      const unauthenticatedStore = createTestStore({ token, user);

      const result = await unauthenticatedStore.dispatch(complaintsApi.endpoints.getComplaints.initiate({}, { skip),
      );

      expect(result.isUninitialized).toBe(true);
    });
  });

  describe("getComplaint", () => {
    it("fetches single complaint successfully", async () => {
      const mockComplaint = {
        id: "1",
        description: "Water supply issue",
        type: "WATER_SUPPLY",
        status: "REGISTERED",
        priority: "HIGH",
        area: "Fort Kochi",
        submittedOn: new Date().toISOString(),
        submittedById: "1",
        statusLogs: [],
        attachments: [],
      };

      const mockResponse = {
        success,
        data: { complaint: mockComplaint },
      };

      server.use(rest.get("/api/complaints/, (req, res, ctx) => {
          expect(req.params.id).toBe("1");
          expect(req.headers.get("authorization")).toBe("Bearer mock-token");
          return res(ctx.json(mockResponse));
        }),
      );

      const result = await store.dispatch(
        complaintsApi.endpoints.getComplaint.initiate("1"),
      );

      expect(result.data).toEqual(mockResponse);
      expect(result.isSuccess).toBe(true);
    });

    it("handles complaint not found", async () => {
      server.use(rest.get("/api/complaints/, (req, res, ctx) => {
          return res(
            ctx.status(404),
            ctx.json({
              success,
              message,
            }),
          );
        }),
      );

      const result = await store.dispatch(
        complaintsApi.endpoints.getComplaint.initiate("nonexistent"),
      );

      expect(result.isError).toBe(true);
    });

    it("handles forbidden access", async () => {
      server.use(rest.get("/api/complaints/, (req, res, ctx) => {
          return res(
            ctx.status(403),
            ctx.json({
              success,
              message,
            }),
          );
        }),
      );

      const result = await store.dispatch(
        complaintsApi.endpoints.getComplaint.initiate("2"),
      );

      expect(result.isError).toBe(true);
    });
  });

  describe("createComplaint", () => {
    it("creates complaint successfully", async () => {
      const newComplaint = {
        description: "Street light broken",
        type: "STREET_LIGHTING",
        priority: "MEDIUM",
        area: "Mattancherry",
        contactPhone: "+91 9876543210",
      };

      const mockResponse = {
        success,
        data: {
          complaint: {
            id: "3",
            ...newComplaint,
            status: "REGISTERED",
            submittedOn: new Date().toISOString(),
            submittedById: "1",
          },
        },
      };

      server.use(
        rest.post("/api/complaints", async (req, res, ctx) => {
          const body = await req.json();
          expect(body.description).toBe(newComplaint.description);
          expect(body.type).toBe(newComplaint.type);
          expect(req.headers.get("authorization")).toBe("Bearer mock-token");
          return res(ctx.json(mockResponse));
        }),
      );

      const result = await store.dispatch(
        complaintsApi.endpoints.createComplaint.initiate(newComplaint),
      );

      expect(result.data).toEqual(mockResponse);
      expect(result.isSuccess).toBe(true);
    });

    it("handles validation errors", async () => {
      server.use(
        rest.post("/api/complaints", (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              success,
              message,
              data: {
                errors: [
                  { field: "description", message: "Description is required" },
                  { field: "type", message: "Invalid complaint type" },
                ],
              },
            }),
          );
        }),
      );

      const result = await store.dispatch(complaintsApi.endpoints.createComplaint.initiate({
          description,
          type: "INVALID_TYPE",
          area: "Test Area",
          contactPhone: "1234567890",
        }),
      );

      expect(result.isError).toBe(true);
    });

    it("invalidates complaints list cache after creation", async () => {
      const mockResponse = {
        success,
        data: {
          complaint: {
            id: "3",
            description: "New complaint",
            type: "WATER_SUPPLY",
            status: "REGISTERED",
          },
        },
      };

      server.use(
        rest.post("/api/complaints", (req, res, ctx) => {
          return res(ctx.json(mockResponse));
        }),
      );

      // Check that cache invalidation tags are set correctly
      const result = await store.dispatch(complaintsApi.endpoints.createComplaint.initiate({
          description,
          type: "WATER_SUPPLY",
          area: "Test Area",
          contactPhone: "1234567890",
        }),
      );

      expect(result.isSuccess).toBe(true);
      // Cache invalidation would be tested by checking if subsequent queries refetch
    });
  });

  describe("updateComplaintStatus", () => {
    it("updates status successfully for authorized users", async () => {
      const wardOfficerStore = createTestStore({
        token,
        user: { id: "ward1", role: "WARD_OFFICER" },
      });

      const mockResponse = {
        success,
        data: {
          complaint: {
            id: "1",
            status: "ASSIGNED",
            description: "Test complaint",
          },
        },
      };

      server.use(rest.put("/api/complaints/, async (req, res, ctx) => {
          const body = await req.json();
          expect(req.params.id).toBe("1");
          expect(body.status).toBe("ASSIGNED");
          expect(body.remarks).toBe("Assigned to maintenance team");
          expect(req.headers.get("authorization")).toBe(
            "Bearer ward-officer-token",
          );
          return res(ctx.json(mockResponse));
        }),
      );

      const result = await wardOfficerStore.dispatch(complaintsApi.endpoints.updateComplaintStatus.initiate({
          id,
          status: "ASSIGNED",
          remarks: "Assigned to maintenance team",
        }),
      );

      expect(result.data).toEqual(mockResponse);
      expect(result.isSuccess).toBe(true);
    });

    it("handles unauthorized status update", async () => {
      server.use(rest.put("/api/complaints/, (req, res, ctx) => {
          return res(
            ctx.status(403),
            ctx.json({
              success,
              message,
            }),
          );
        }),
      );

      const result = await store.dispatch(complaintsApi.endpoints.updateComplaintStatus.initiate({
          id,
          status: "ASSIGNED",
        }),
      );

      expect(result.isError).toBe(true);
    });
  });

  describe("addComplaintFeedback", () => {
    it("adds feedback successfully for resolved complaints", async () => {
      const mockResponse = {
        success,
        data: {
          complaint: {
            id: "1",
            status: "RESOLVED",
            rating,
            citizenFeedback: "Good service, resolved quickly",
          },
        },
      };

      server.use(rest.post("/api/complaints/, async (req, res, ctx) => {
          const body = await req.json();
          expect(req.params.id).toBe("1");
          expect(body.rating).toBe(4);
          expect(body.citizenFeedback).toBe("Good service, resolved quickly");
          expect(req.headers.get("authorization")).toBe("Bearer mock-token");
          return res(ctx.json(mockResponse));
        }),
      );

      const result = await store.dispatch(complaintsApi.endpoints.addComplaintFeedback.initiate({
          id,
          feedback: "Good service, resolved quickly",
          rating,
        }),
      );

      expect(result.data).toEqual(mockResponse);
      expect(result.isSuccess).toBe(true);
    });

    it("prevents feedback on non-resolved complaints", async () => {
      server.use(rest.post("/api/complaints/, (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              success,
              message,
            }),
          );
        }),
      );

      const result = await store.dispatch(complaintsApi.endpoints.addComplaintFeedback.initiate({
          id,
          feedback: "Test feedback",
          rating,
        }),
      );

      expect(result.isError).toBe(true);
    });
  });

  describe("getComplaintStatistics", () => {
    it("fetches statistics with role-based filtering", async () => {
      const mockStats = {
        total,
        byStatus: {
          REGISTERED,
          ASSIGNED,
          IN_PROGRESS,
          RESOLVED,
          CLOSED,
        },
        byPriority: {
          LOW,
          MEDIUM,
          HIGH,
          CRITICAL,
        },
        byType: {
          WATER_SUPPLY,
          ELECTRICITY,
          ROAD_REPAIR,
          STREET_LIGHTING,
        },
        avgResolutionTime: 2.5,
      };

      const mockResponse = {
        success,
        data: { stats: mockStats },
      };

      server.use(
        rest.get("/api/complaints/stats", (req, res, ctx) => {
          expect(req.headers.get("authorization")).toBe("Bearer mock-token");
          return res(ctx.json(mockResponse));
        }),
      );

      const result = await store.dispatch(
        complaintsApi.endpoints.getComplaintStatistics.initiate({}),
      );

      expect(result.data).toEqual(mockResponse);
      expect(result.isSuccess).toBe(true);
      expect(result.data?.data.stats.total).toBe(10);
    });

    it("applies date range filters", async () => {
      const mockResponse = {
        success,
        data: { stats: { total: 5 } },
      };

      server.use(
        rest.get("/api/complaints/stats", (req, res, ctx) => {
          expect(req.url.searchParams.get("dateFrom")).toBe("2024-01-01");
          expect(req.url.searchParams.get("dateTo")).toBe("2024-01-31");
          return res(ctx.json(mockResponse));
        }),
      );

      await store.dispatch(complaintsApi.endpoints.getComplaintStatistics.initiate({
          dateFrom,
          dateTo: "2024-01-31",
        }),
      );
    });
  });

  describe("caching and invalidation", () => {
    it("caches complaint queries correctly", async () => {
      const mockResponse = {
        success,
        data: { complaints: [], pagination: {} },
      };

      let requestCount = 0;
      server.use(
        rest.get("/api/complaints", (req, res, ctx) => {
          requestCount++;
          return res(ctx.json(mockResponse));
        }),
      );

      // First request
      await store.dispatch(complaintsApi.endpoints.getComplaints.initiate({ page),
      );

      // Second identical request should use cache
      await store.dispatch(complaintsApi.endpoints.getComplaints.initiate({ page),
      );

      expect(requestCount).toBe(1); // Should only make one network request
    });

    it("invalidates cache after mutations", async () => {
      const listResponse = {
        success,
        data: {
          complaints: [{ id: "1", status: "REGISTERED" }],
          pagination: {},
        },
      };

      const updateResponse = {
        success,
        data: { complaint: { id: "1", status: "ASSIGNED" } },
      };

      server.use(
        rest.get("/api/complaints", (req, res, ctx) => {
          return res(ctx.json(listResponse));
        }),
        rest.put("/api/complaints/, (req, res, ctx) => {
          return res(ctx.json(updateResponse));
        }),
      );

      // Initial query
      await store.dispatch(complaintsApi.endpoints.getComplaints.initiate({ page),
      );

      // Update mutation should invalidate cache
      await store.dispatch(complaintsApi.endpoints.updateComplaintStatus.initiate({
          id,
          status: "ASSIGNED",
        }),
      );

      // Cache should be invalidated, allowing fresh data on next query
      const state = store.getState();
      const cacheKeys = Object.keys(state.api.queries);
      expect(cacheKeys.length).toBeGreaterThan(0);
    });
  });

  describe("optimistic updates", () => {
    it("applies optimistic updates for complaint mutations", async () => {
      // First, populate cache with initial complaint
      store.dispatch(complaintsApi.util.upsertQueryData(
          "getComplaints",
          { page,
          {
            success,
            data: {
              complaints: [
                { id: "1", status: "REGISTERED", description: "Test" },
              ],
              pagination: {},
            },
          },
        ),
      );

      let requestPromiseResolve: (value) => void;
      const requestPromise = new Promise((resolve) => {
        requestPromiseResolve = resolve;
      });

      server.use(rest.put("/api/complaints/, async (req, res, ctx) => {
          await requestPromise;
          return res(ctx.json({
              success,
              data, status: "ASSIGNED" } },
            }),
          );
        }),
      );

      // Start mutation
      const mutationPromise = store.dispatch(complaintsApi.endpoints.updateComplaint.initiate({
          id,
          status: "ASSIGNED",
        }),
      );

      // Check optimistic update was applied
      const cacheEntry = complaintsApi.endpoints.getComplaints.select({
        page,
      })(store.getState());
      expect(cacheEntry.data?.data.complaints[0].status).toBe("ASSIGNED");

      // Resolve request
      requestPromiseResolve(null);
      await mutationPromise;
    });
  });
});
