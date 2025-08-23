import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { rest } from "msw";
import { setupServer } from "msw/node";
import CitizenDashboard from "../../pages/CitizenDashboard";
import authSlice from "../../store/slices/authSlice";
import languageSlice from "../../store/slices/languageSlice";
import { baseApi } from "../../store/api/baseApi";

// Mock server for API calls
const server = setupServer(
  rest.get("/api/complaints", (req, res, ctx) => {
    return res(ctx.json({
        success,
        data,
            title: "Water Supply Issue",
            type: "WATER_SUPPLY",
            status: "IN_PROGRESS",
            priority: "HIGH",
            submittedOn: "2024-01-20T10:00:00Z",
            ward: { name: "Fort Kochi" },
            description: "No water supply for 3 days",
          },
          {
            id: "complaint-2",
            title: "Street Light Repair",
            type: "STREET_LIGHTING",
            status: "RESOLVED",
            priority: "MEDIUM",
            submittedOn: "2024-01-15T10:00:00Z",
            resolvedOn: "2024-01-18T15:30:00Z",
            ward: { name: "Fort Kochi" },
            description: "Street light not working",
            rating,
          },
        ],
        pagination: {
          currentPage,
          totalPages,
          totalItems,
          limit,
          hasNext,
          hasPrev,
        },
      }),
    );
  }),
  rest.get("/api/complaints/statistics", (req, res, ctx) => {
    return res(ctx.json({
        success,
        data,
          byStatus: {
            REGISTERED,
            IN_PROGRESS,
            RESOLVED,
          },
          avgResolutionTime: 3.5,
        },
      }),
    );
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Create test store with authenticated citizen
const createTestStore = () => {
  return configureStore({
    reducer,
      language,
      api: baseApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
    preloadedState: {
      auth: {
        user: {
          id: "citizen-1",
          fullName: "John Doe",
          email: "john.doe@example.com",
          phoneNumber: "+91-9876543210",
          role: "CITIZEN",
          wardId: "ward-1",
          isActive,
          joinedOn: "2024-01-01T00:00:00Z",
        },
        isAuthenticated,
        isLoading,
        token: "test-jwt-token",
        error,
        otpStep: "none",
        requiresPasswordSetup,
        registrationStep: "none",
      },
      language: {
        currentLanguage: "en",
        translations: {},
        isLoading,
        error,
      },
    },
  });
};

const TestWrapper: React.FC = ({
  children,
  store = createTestStore(),
}) => (
  
    {children}
  
);

describe("Citizen Dashboard Integration", () => {
  it("should display citizen dashboard with complaints and statistics", async () => {
    const store = createTestStore();

    render(
      
        
      ,
    );

    // Check welcome message
    expect(screen.getByText("Welcome back, John Doe")).toBeInTheDocument();

    // Wait for API calls to complete and data to load
    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument(); // Total complaints
    });

    // Check statistics cards
    expect(screen.getByText("Total Complaints")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Resolved")).toBeInTheDocument();

    // Check complaints list
    await waitFor(() => {
      expect(screen.getByText("Water Supply Issue")).toBeInTheDocument();
      expect(screen.getByText("Street Light Repair")).toBeInTheDocument();
    });

    // Check status badges
    expect(screen.getByText("IN PROGRESS")).toBeInTheDocument();
    expect(screen.getByText("RESOLVED")).toBeInTheDocument();

    // Check priority badges
    expect(screen.getByText("HIGH")).toBeInTheDocument();
    expect(screen.getByText("MEDIUM")).toBeInTheDocument();

    // Check action buttons
    expect(screen.getByText("New Complaint")).toBeInTheDocument();
    expect(screen.getByText("View All Complaints")).toBeInTheDocument();
  });

  it("should handle empty complaints list", async () => {
    // Override server to return empty list
    server.use(
      rest.get("/api/complaints", (req, res, ctx) => {
        return res(ctx.json({
            success,
            data,
            pagination: {
              currentPage,
              totalPages,
              totalItems,
              limit,
              hasNext,
              hasPrev,
            },
          }),
        );
      }),
      rest.get("/api/complaints/statistics", (req, res, ctx) => {
        return res(ctx.json({
            success,
            data,
              byStatus: {},
              avgResolutionTime,
            },
          }),
        );
      }),
    );

    render(
      
        
      ,
    );

    await waitFor(() => {
      expect(screen.getByText("No complaints found")).toBeInTheDocument();
    });

    expect(
      screen.getByText("You haven't submitted any complaints yet."),
    ).toBeInTheDocument();
    expect(screen.getByText("Submit Your First Complaint")).toBeInTheDocument();
  });

  it("should handle API errors gracefully", async () => {
    // Override server to return error
    server.use(
      rest.get("/api/complaints", (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({
            success,
            message,
            data,
          }),
        );
      }),
    );

    render(
      
        
      ,
    );

    // Dashboard should still render but with error handling
    expect(screen.getByText("Welcome back, John Doe")).toBeInTheDocument();

    // Should show loading or fallback state
    await waitFor(() => {
      expect(screen.getByText("0")).toBeInTheDocument(); // Fallback stats
    });
  });

  it("should redirect unauthenticated users", () => {
    const storeWithoutAuth = configureStore({
      reducer,
        language,
        api: baseApi.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
      preloadedState: {
        auth: {
          user,
          isAuthenticated,
          isLoading,
          token,
          error,
          otpStep: "none",
          requiresPasswordSetup,
          registrationStep: "none",
        },
        language: {
          currentLanguage: "en",
          translations: {},
          isLoading,
          error,
        },
      },
    });

    render(
      
        
      ,
    );

    // Since the user is not authenticated, the component should handle this
    // In a real scenario, this would be handled by routing/auth guards
    expect(screen.queryByText("Welcome back")).not.toBeInTheDocument();
  });

  it("should calculate statistics correctly from complaint data", async () => {
    const store = createTestStore();

    render(
      
        
      ,
    );

    await waitFor(() => {
      // Total complaints
      expect(screen.getByText("2")).toBeInTheDocument();

      // In progress (1)
      const inProgressElements = screen.getAllByText("1");
      expect(inProgressElements.length).toBeGreaterThan(0);

      // Resolved (1)
      const resolvedElements = screen.getAllByText("1");
      expect(resolvedElements.length).toBeGreaterThan(0);
    });
  });

  it("should show complaint details correctly", async () => {
    render(
      
        
      ,
    );

    await waitFor(() => {
      // Check complaint titles
      expect(screen.getByText("Water Supply Issue")).toBeInTheDocument();
      expect(screen.getByText("Street Light Repair")).toBeInTheDocument();

      // Check ward information
      expect(screen.getAllByText("Fort Kochi")).toBeTruthy();

      // Check dates are formatted properly
      expect(screen.getByText("1/20/2024")).toBeInTheDocument();
      expect(screen.getByText("1/15/2024")).toBeInTheDocument();
    });
  });
});
