import { lazy } from "react";
import type { ComponentType } from "react";

type ImportFactory<T extends ComponentType<any>> = () => Promise<{
  default: T;
}>;

interface LazyRetryOptions {
  retries?: number;
  retryDelay?: number;
}

const CHUNK_ERROR_PATTERNS = [
  /Loading chunk [\d]+ failed/i,
  /ChunkLoadError/i,
  /Failed to fetch dynamically imported module/i,
];

const hasWindow = typeof window !== "undefined";
const reloadFlagKey = "__lazy_retry_reload__";

function shouldForceReload(error: unknown): boolean {
  if (!hasWindow) {
    return false;
  }

  const message =
    (error instanceof Error ? error.message : String(error)) ?? "";
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

async function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function lazyWithRetry<T extends ComponentType<any>>(
  factory: ImportFactory<T>,
  options: LazyRetryOptions = {},
) {
  const { retries = 3, retryDelay = 500 } = options;

  let attempt = 0;
  let pendingPromise: Promise<{ default: T }> | null = null;

  const importWithRetry = async (): Promise<{ default: T }> => {
    try {
      return await factory();
    } catch (error) {
      attempt += 1;

      if (shouldForceReload(error)) {
        const hasReloaded = sessionStorage.getItem(reloadFlagKey);
        if (!hasReloaded) {
          sessionStorage.setItem(reloadFlagKey, "true");
          window.location.reload();
        }
      }

      if (attempt <= retries) {
        const delay = retryDelay * Math.pow(2, attempt - 1);
        await wait(delay);
        return importWithRetry();
      }

      throw error;
    }
  };

  return lazy(() => {
    if (!pendingPromise) {
      pendingPromise = importWithRetry().finally(() => {
        pendingPromise = null;
      });
    }
    return pendingPromise;
  });
}
