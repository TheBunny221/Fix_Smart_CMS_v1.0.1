import { jsx as _jsx } from "react/jsx-runtime";
class PerformanceMonitor {
    metrics = new Map();
    renderThreshold = 10; // Alert if component renders more than 10 times in 5 seconds
    apiCallThreshold = 5; // Alert if same API called more than 5 times in 5 seconds
    timeWindow = 5000; // 5 seconds
    /**
     * Track component render
     */
    trackRender(componentName) {
        const now = Date.now();
        const existing = this.metrics.get(componentName);
        if (existing) {
            // Reset counter if outside time window
            if (now - existing.lastRenderTime > this.timeWindow) {
                existing.renderCount = 1;
            }
            else {
                existing.renderCount++;
            }
            existing.lastRenderTime = now;
            // Alert if threshold exceeded
            if (existing.renderCount > this.renderThreshold) {
                console.warn(`🚨 PERFORMANCE WARNING: ${componentName} has rendered ${existing.renderCount} times in ${this.timeWindow}ms. Possible infinite loop detected!`);
            }
        }
        else {
            this.metrics.set(componentName, {
                componentName,
                renderCount: 1,
                apiCallCount: 0,
                lastRenderTime: now,
                apiCalls: [],
            });
        }
    }
    /**
     * Track API call
     */
    trackApiCall(url, method = 'GET') {
        const now = Date.now();
        // Track calls for each unique URL
        for (const [componentName, metrics] of this.metrics.entries()) {
            // Add API call to recent calls
            metrics.apiCalls.push({ url, timestamp: now, method });
            // Remove old calls outside time window
            metrics.apiCalls = metrics.apiCalls.filter(call => now - call.timestamp <= this.timeWindow);
            // Count calls to same URL
            const sameUrlCalls = metrics.apiCalls.filter(call => call.url === url);
            if (sameUrlCalls.length > this.apiCallThreshold) {
                console.warn(`🚨 API WARNING: ${url} called ${sameUrlCalls.length} times in ${this.timeWindow}ms. Possible excessive API calls!`);
            }
        }
    }
    /**
     * Get performance report
     */
    getReport() {
        const report = {};
        for (const [key, value] of this.metrics.entries()) {
            report[key] = { ...value };
        }
        return report;
    }
    /**
     * Clear metrics
     */
    clear() {
        this.metrics.clear();
    }
    /**
     * Set thresholds
     */
    setThresholds(renderThreshold, apiCallThreshold, timeWindow = 5000) {
        this.renderThreshold = renderThreshold;
        this.apiCallThreshold = apiCallThreshold;
        this.timeWindow = timeWindow;
    }
}
// Global instance
export const performanceMonitor = new PerformanceMonitor();
/**
 * React hook to track component renders
 */
export function useRenderTracker(componentName) {
    if (process.env.NODE_ENV === 'development') {
        performanceMonitor.trackRender(componentName);
    }
}
/**
 * Fetch wrapper that tracks API calls
 */
export async function trackedFetch(url, options) {
    if (process.env.NODE_ENV === 'development') {
        performanceMonitor.trackApiCall(url, options?.method || 'GET');
    }
    return fetch(url, options);
}
/**
 * Higher-order component to track renders
 */
export function withRenderTracking(Component, componentName) {
    const WrappedComponent = (props) => {
        const name = componentName || Component.displayName || Component.name;
        useRenderTracker(name);
        return _jsx(Component, { ...props });
    };
    WrappedComponent.displayName = `withRenderTracking(${Component.displayName || Component.name})`;
    return WrappedComponent;
}
/**
 * Development-only performance logger
 */
export function logPerformanceReport() {
    if (process.env.NODE_ENV === 'development') {
        const report = performanceMonitor.getReport();
        console.group('📊 Performance Report');
        for (const [componentName, metrics] of Object.entries(report)) {
            console.log(`${componentName}:`, {
                renders: metrics.renderCount,
                apiCalls: metrics.apiCallCount,
                recentApiCalls: metrics.apiCalls.length,
            });
        }
        console.groupEnd();
    }
}
export default performanceMonitor;
