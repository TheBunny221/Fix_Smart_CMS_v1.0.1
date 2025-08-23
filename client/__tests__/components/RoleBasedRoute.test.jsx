import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import {
  renderWithAuth,
  renderWithoutAuth,
  mockNavigate,
} from "../utils/test-utils";
import RoleBasedRoute from "../../components/RoleBasedRoute";

// Mock the toast hook
vi.mock("../../components/ui/use-toast", () => ({
  toast),
}));

const TestComponent = () => Protected Content;

describe("RoleBasedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when user is authenticated", () => {
    it("renders children when user has required role", () => {
      renderWithAuth(,
        { role,
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("redirects to unauthorized when user lacks required role", () => {
      renderWithAuth(,
        { role,
      );

      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    it("allows multiple roles", () => {
      renderWithAuth(,
        { role,
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("executes custom permission check", () => {
      const customCheck = vi.fn().mockReturnValue(true);

      renderWithAuth(,
        { role,
      );

      expect(customCheck).toHaveBeenCalled();
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("redirects when custom permission check fails", () => {
      const customCheck = vi.fn().mockReturnValue(false);

      renderWithAuth(,
        { role,
      );

      expect(customCheck).toHaveBeenCalled();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  describe("when user is not authenticated", () => {
    it("redirects to login page", () => {
      renderWithoutAuth(
        
          
        ,
      );

      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    it("redirects to custom fallback path", () => {
      renderWithoutAuth(
        
          
        ,
      );

      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  describe("loading states", () => {
    it("shows loading component when auth is loading", () => {
      renderWithAuth(,
        { role,
        {
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
          },
        },
      );

      expect(
        screen.getByText("Verifying authentication..."),
      ).toBeInTheDocument();
    });

    it("shows custom loading component", () => {
      const CustomLoader = () => Custom Loading...;

      renderWithAuth(}
        >
          
        ,
        { role,
        {
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
          },
        },
      );

      expect(screen.getByText("Custom Loading...")).toBeInTheDocument();
    });
  });

  describe("token expiration handling", () => {
    it("handles expired token", async () => {
      // Mock expired token
      const expiredToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

      renderWithAuth(,
        { role,
        {
          preloadedState: {
            auth: {
              user: { id: "1", role: "CITIZEN" },
              isAuthenticated,
              token,
              isLoading,
              error,
              otpStep: "none",
              requiresPasswordSetup,
              registrationStep: "none",
            },
          },
        },
      );

      // Token expiration should be handled automatically
      // This would trigger logout in the actual component
    });
  });
});
