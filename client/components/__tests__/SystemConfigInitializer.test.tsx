import React from "react";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import SystemConfigInitializer from "../SystemConfigInitializer";
import systemConfigSlice from "../../store/slices/systemConfigSlice";
import { vi } from "vitest";

// Mock the toast hook
vi.mock("../ui/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the fetch function
global.fetch = vi.fn();

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      systemConfig: systemConfigSlice,
    },
    preloadedState: {
      systemConfig: {
        data: {},
        complaintTypes: [],
        loading: false,
        error: null,
        lastFetched: null,
        ...initialState,
      },
    },
  });
};

describe("SystemConfigInitializer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children without blocking", () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <SystemConfigInitializer>
          <div>Test Content</div>
        </SystemConfigInitializer>
      </Provider>
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("fetches system config on mount when not previously fetched", () => {
    const store = createTestStore();
    
    // Mock successful API response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          config: [
            { key: "APP_NAME", value: "Test App", type: "string" }
          ],
          complaintTypes: []
        }
      }),
    });

    render(
      <Provider store={store}>
        <SystemConfigInitializer>
          <div>Test Content</div>
        </SystemConfigInitializer>
      </Provider>
    );

    expect(global.fetch).toHaveBeenCalledWith("/api/system-config/public", expect.any(Object));
  });

  it("does not fetch when recently fetched", () => {
    const recentTime = new Date().toISOString();
    const store = createTestStore({ lastFetched: recentTime });
    
    render(
      <Provider store={store}>
        <SystemConfigInitializer>
          <div>Test Content</div>
        </SystemConfigInitializer>
      </Provider>
    );

    expect(global.fetch).not.toHaveBeenCalled();
  });
});