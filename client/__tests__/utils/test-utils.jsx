import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import authSlice from "../../store/slices/authSlice";
import languageSlice from "../../store/slices/languageSlice";
import uiSlice from "../../store/slices/uiSlice";
import { baseApi } from "../../store/api/baseApi";

// Test store configuration
export function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer,
      language,
      ui,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck,
            "api/executeQuery/fulfilled",
            "api/executeQuery/rejected",
          ],
        },
      }).concat(baseApi.middleware),
  });
}

// Custom render function with providers
interface CustomRenderOptions extends Omit {
  preloadedState?;
  store: ReturnType;
  initialEntries?;
  queryClient?;
}

export function renderWithProviders(ui,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    initialEntries = ["/"],
    queryClient = new QueryClient({
      defaultOptions,
          staleTime,
          cacheTime,
        },
        mutations: {
          retry,
        },
      },
    }),
    ...renderOptions
  } = {},
) {
  function Wrapper({ children }) {
    return (
      
        
          {children}
        
      
    );
  }

  return {
    store,
    queryClient,
    ...render(ui, { wrapper, ...renderOptions }),
  };
}

// Helper to render with authentication
export function renderWithAuth(ui,
  userOverrides = {},
  options = {},
) {
  const mockUser = {
    id: "1",
    fullName: "Test User",
    email: "test@example.com",
    role: "CITIZEN",
    isActive,
    joinedOn: new Date().toISOString(),
    ...userOverrides,
  };

  const preloadedState = {
    auth: {
      user,
      token: "mock-token",
      isAuthenticated,
      isLoading,
      error,
      otpStep: "none",
      requiresPasswordSetup,
      registrationStep: "none",
    },
    language: {
      currentLanguage: "en",
      translations: {
        common: { loading: "Loading...", error: "Error" },
        messages: {
          operationSuccess: "Success",
          unauthorizedAccess: "Unauthorized",
        },
      },
      isLoading,
    },
    ...options.preloadedState,
  };

  return renderWithProviders(ui, { ...options, preloadedState });
}

// Helper to render without authentication
export function renderWithoutAuth(ui,
  options = {},
) {
  const preloadedState = {
    auth: {
      user,
      token,
      isAuthenticated,
      isLoading,
      error,
      otpStep: "none",
      requiresPasswordSetup,
      registrationStep: "none",
    },
    language: {
      currentLanguage: "en",
      translations: {
        common: { loading: "Loading...", error: "Error" },
        messages: { unauthorizedAccess: "Unauthorized" },
      },
      isLoading,
    },
    ...options.preloadedState,
  };

  return renderWithProviders(ui, { ...options, preloadedState });
}

// Form testing utilities
export const fillFormField = async (getByLabelText) => HTMLElement,
  labelText,
  value,
) => {
  const field = getByLabelText(labelText);
  await userEvent.clear(field);
  await userEvent.type(field, value);
  return field;
};

export const submitForm = async (getByRole, options?) => HTMLElement,
) => {
  const submitButton = getByRole("button", { name);
  await userEvent.click(submitButton);
  return submitButton;
};

// Mock implementations
export const mockNavigate = vi.fn();
export const mockLocation = {
  pathname: "/",
  search: "",
  hash: "",
  state,
  key: "default",
};

// Mock react-router hooks
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

// Helper for testing async components
export const waitForElementToBeRemoved = async (
  element,
  timeout = 1000,
) => {
  const startTime = Date.now();
  while (document.body.contains(element)) {
    if (Date.now() - startTime > timeout) {
      throw new Error("Element was not removed within timeout");
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
};

// Helper for testing loading states
export const expectLoadingState = (container) => {
  expect(container).toHaveTextContent(/loading/i);
};

export const expectErrorState = (
  container,
  errorText?,
) => {
  if (errorText) {
    expect(container).toHaveTextContent(errorText);
  } else {
    expect(container).toHaveTextContent(/error/i);
  }
};

// Helper for testing accessibility
export const expectAccessibleForm = (form) => {
  const inputs = form.querySelectorAll("input, select, textarea");
  inputs.forEach((input) => {
    const label = form.querySelector(`label[for="${input.id}"]`);
    if (
      label &&
      input.getAttribute("aria-label") &&
      input.getAttribute("aria-labelledby")
    ) {
      throw new Error(`Input ${input.id || input.name} is missing a label`);
    }
  });
};

// Helper for testing keyboard navigation
export const testKeyboardNavigation = async (
  container,
  keySequence,
) => {
  for (const key of keySequence) {
    await userEvent.keyboard(`{${key}}`);
  }
};

// Helper for testing responsive design
export const setViewport = (width, height) => {
  Object.defineProperty(window, "innerWidth", {
    writable,
    configurable,
    value,
  });
  Object.defineProperty(window, "innerHeight", {
    writable,
    configurable,
    value,
  });
  window.dispatchEvent(new Event("resize"));
};

// Helper for testing intersection observer
export const mockIntersectionObserver = (isIntersecting = true) => {
  const mockObserver = {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  };

  global.IntersectionObserver = vi.fn().mockImplementation((callback) => {
    // Immediately trigger callback if needed
    if (isIntersecting) {
      setTimeout(() => {
        callback([{ isIntersecting }]);
      }, 0);
    }
    return mockObserver;
  });

  return mockObserver;
};

// Helper for testing local storage
export const mockLocalStorageImplementation = () => {
  const store: Record = {};

  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
  };
};

// Helper for testing API calls
export const expectApiCall = (method, url, body?) => {
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining(url),
    expect.objectContaining({
      method),
      ...(body && { body) }),
    }),
  );
};

// Re-export testing library utilities
export * from "@testing-library/react";
export { userEvent } from "@testing-library/user-event";
export { vi } from "vitest";
