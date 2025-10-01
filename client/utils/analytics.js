import React from "react";
class AnalyticsManager {
    isEnabled = true;
    userId = null;
    sessionId;
    eventQueue = [];
    errorQueue = [];
    performanceQueue = [];
    userEventQueue = [];
    flushInterval = null;
    isOnline = navigator.onLine;
    constructor() {
        this.sessionId = this.generateSessionId();
        this.initializeFlushInterval();
        this.setupOnlineStatusListener();
        this.setupUnloadListener();
        this.setupPerformanceObserver();
    }
    // Configuration
    setUserId(userId) {
        this.userId = userId;
    }
    setEnabled(enabled) {
        this.isEnabled = enabled;
    }
    // Event Tracking
    track(event) {
        if (!this.isEnabled)
            return;
        const enhancedEvent = {
            ...event,
            ...(this.userId ? { userId: this.userId } : {}),
            timestamp: Date.now(),
        };
        this.eventQueue.push(enhancedEvent);
        this.scheduleFlush();
        // Send to external analytics if available
        this.sendToExternalAnalytics(enhancedEvent);
    }
    // Error Tracking
    trackError(error, context, metadata, severity = "medium") {
        if (!this.isEnabled)
            return;
        const errorEvent = {
            error,
            userAgent: navigator.userAgent,
            url: window.location.href,
            timestamp: Date.now(),
            severity,
            ...(context ? { context } : {}),
            ...(this.userId ? { userId: this.userId } : {}),
            ...(metadata ? { metadata } : {}),
        };
        this.errorQueue.push(errorEvent);
        this.scheduleFlush();
        // Send to external error tracking
        this.sendToExternalErrorTracking(errorEvent);
        // Log to console in development
        if (process.env.NODE_ENV === "development") {
            console.error("Analytics Error:", errorEvent);
        }
    }
    // Performance Tracking
    trackPerformance(name, duration, metadata) {
        if (!this.isEnabled)
            return;
        const performanceEvent = {
            name,
            duration,
            startTime: performance.now() - duration,
            endTime: performance.now(),
            timestamp: Date.now(),
            ...(metadata ? { metadata } : {}),
        };
        this.performanceQueue.push(performanceEvent);
        this.scheduleFlush();
    }
    // User Action Tracking
    trackUserAction(action, entity, entityId, metadata) {
        if (!this.isEnabled || !this.userId)
            return;
        const userEvent = {
            userId: this.userId,
            action,
            timestamp: Date.now(),
            ...(entity ? { entity } : {}),
            ...(entityId ? { entityId } : {}),
            ...(metadata ? { metadata } : {}),
        };
        this.userEventQueue.push(userEvent);
        this.scheduleFlush();
    }
    // Page View Tracking
    trackPageView(page, title, metadata) {
        const payload = {
            event: "page_view",
            category: "navigation",
            action: "view",
            label: page,
        };
        const combinedMeta = { ...(title ? { title } : {}), ...metadata };
        if (Object.keys(combinedMeta).length > 0) {
            payload.metadata = combinedMeta;
        }
        this.track(payload);
    }
    // Complaint System Specific Events
    trackComplaintEvent(action, complaintId, metadata) {
        const payload = {
            event: "complaint_action",
            category: "complaints",
            action,
            ...(complaintId ? { label: complaintId } : {}),
        };
        if (metadata)
            payload.metadata = metadata;
        this.track(payload);
        this.trackUserAction(action, "complaint", complaintId, metadata);
    }
    trackAuthEvent(action, method, metadata) {
        const payload = {
            event: "auth_action",
            category: "authentication",
            action,
            ...(method ? { label: method } : {}),
        };
        if (metadata)
            payload.metadata = metadata;
        this.track(payload);
    }
    trackFormEvent(action, formName, metadata) {
        const payload = {
            event: "form_action",
            category: "forms",
            action,
            label: formName,
        };
        if (metadata)
            payload.metadata = metadata;
        this.track(payload);
    }
    trackSearchEvent(query, results, metadata) {
        const payload = {
            event: "search",
            category: "search",
            action: "query",
            label: query,
            value: results,
        };
        if (metadata)
            payload.metadata = metadata;
        this.track(payload);
    }
    // Private methods
    generateSessionId() {
        return ("session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9));
    }
    initializeFlushInterval() {
        this.flushInterval = setInterval(() => {
            this.flush();
        }, 30000); // Flush every 30 seconds
    }
    scheduleFlush() {
        // Flush immediately if queues are getting large
        const totalEvents = this.eventQueue.length +
            this.errorQueue.length +
            this.performanceQueue.length +
            this.userEventQueue.length;
        if (totalEvents >= 10) {
            this.flush();
        }
    }
    async flush() {
        if (!this.isOnline)
            return;
        const events = [...this.eventQueue];
        const errors = [...this.errorQueue];
        const performance = [...this.performanceQueue];
        const userEvents = [...this.userEventQueue];
        // Clear queues
        this.eventQueue = [];
        this.errorQueue = [];
        this.performanceQueue = [];
        this.userEventQueue = [];
        if (events.length === 0 &&
            errors.length === 0 &&
            performance.length === 0 &&
            userEvents.length === 0) {
            return;
        }
        try {
            await this.sendToServer({
                sessionId: this.sessionId,
                events,
                errors,
                performance,
                userEvents,
                timestamp: Date.now(),
            });
        }
        catch (error) {
            // Put events back in queue if sending failed
            this.eventQueue.unshift(...events);
            this.errorQueue.unshift(...errors);
            this.performanceQueue.unshift(...performance);
            this.userEventQueue.unshift(...userEvents);
            console.warn("Failed to send analytics data:", error);
        }
    }
    async sendToServer(data) {
        const response = await fetch("/api/analytics", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error(`Analytics server responded with ${response.status}`);
        }
    }
    sendToExternalAnalytics(event) {
        // Google Analytics 4
        if (window.gtag) {
            window.gtag("event", event.action, {
                event_category: event.category,
                event_label: event.label,
                value: event.value,
                custom_parameter_1: event.metadata?.source,
                custom_parameter_2: event.metadata?.feature,
            });
        }
    }
    sendToExternalErrorTracking(error) {
        // Sentry
        if (window.Sentry) {
            window.Sentry.captureException(error.error, {
                tags: {
                    context: error.context,
                    severity: error.severity,
                },
                extra: error.metadata,
                user: {
                    id: error.userId,
                },
            });
        }
    }
    setupOnlineStatusListener() {
        window.addEventListener("online", () => {
            this.isOnline = true;
            this.flush(); // Flush queued events when back online
        });
        window.addEventListener("offline", () => {
            this.isOnline = false;
        });
    }
    setupUnloadListener() {
        window.addEventListener("beforeunload", () => {
            // Use sendBeacon for reliable delivery on page unload
            if (navigator.sendBeacon && this.isOnline) {
                const data = {
                    sessionId: this.sessionId,
                    events: this.eventQueue,
                    errors: this.errorQueue,
                    performance: this.performanceQueue,
                    userEvents: this.userEventQueue,
                    timestamp: Date.now(),
                };
                navigator.sendBeacon("/api/analytics", JSON.stringify(data));
            }
        });
    }
    setupPerformanceObserver() {
        if ("PerformanceObserver" in window) {
            // Track Largest Contentful Paint
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.trackPerformance("lcp", lastEntry.startTime, {
                    element: lastEntry.element?.tagName,
                    url: lastEntry.url,
                });
            });
            lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
            // Track First Input Delay
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    this.trackPerformance("fid", entry.processingStart - entry.startTime, {
                        eventType: entry.name,
                    });
                });
            });
            fidObserver.observe({ entryTypes: ["first-input"] });
            // Track Cumulative Layout Shift
            let clsValue = 0;
            const clsObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                this.trackPerformance("cls", clsValue);
            });
            clsObserver.observe({ entryTypes: ["layout-shift"] });
        }
    }
    // Public method to get analytics data for debugging
    getQueueStatus() {
        return {
            events: this.eventQueue.length,
            errors: this.errorQueue.length,
            performance: this.performanceQueue.length,
            userEvents: this.userEventQueue.length,
            sessionId: this.sessionId,
            userId: this.userId,
            isEnabled: this.isEnabled,
            isOnline: this.isOnline,
        };
    }
}
// Global analytics instance
export const analytics = new AnalyticsManager();
// React Hook for analytics
export function useAnalytics() {
    return {
        track: analytics.track.bind(analytics),
        trackError: analytics.trackError.bind(analytics),
        trackPerformance: analytics.trackPerformance.bind(analytics),
        trackUserAction: analytics.trackUserAction.bind(analytics),
        trackPageView: analytics.trackPageView.bind(analytics),
        trackComplaintEvent: analytics.trackComplaintEvent.bind(analytics),
        trackAuthEvent: analytics.trackAuthEvent.bind(analytics),
        trackFormEvent: analytics.trackFormEvent.bind(analytics),
        trackSearchEvent: analytics.trackSearchEvent.bind(analytics),
        setUserId: analytics.setUserId.bind(analytics),
        getQueueStatus: analytics.getQueueStatus.bind(analytics),
    };
}
// Higher-order component for automatic page view tracking
export function withPageTracking(Component, pageName) {
    return function TrackedComponent(props) {
        React.useEffect(() => {
            analytics.trackPageView(pageName);
        }, []);
        return React.createElement(Component, props);
    };
}
// Error boundary with analytics
export class AnalyticsErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        analytics.trackError(error, "react_error_boundary", {
            componentStack: errorInfo.componentStack,
            errorBoundary: true,
        }, "high");
    }
    render() {
        if (this.state.hasError && this.state.error) {
            const Fallback = this.props.fallback;
            return Fallback
                ? React.createElement(Fallback, { error: this.state.error })
                : React.createElement("div", {}, "Something went wrong.");
        }
        return this.props.children;
    }
}
export default analytics;
