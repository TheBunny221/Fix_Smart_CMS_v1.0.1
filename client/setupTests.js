import "@testing-library/jest-dom";
import { vi } from "vitest";
// Mock IntersectionObserver
// @ts-expect-error jsdom doesn't implement this
globalThis.IntersectionObserver = class IntersectionObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    unobserve() { }
};
// Mock ResizeObserver
// @ts-expect-error jsdom doesn't implement this
globalThis.ResizeObserver = class ResizeObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    unobserve() { }
};
// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
};
// Ensure property is writable in jsdom
Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
});
// Mock fetch
globalThis.fetch = vi.fn();
// Mock react-router-dom
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => vi.fn(),
        useLocation: () => ({
            pathname: "/",
            search: "",
            hash: "",
            state: null,
            key: "default",
        }),
    };
});
