import React from "react";

// Analytics and Event Tracking System

export 

export 

export 

export 

class AnalyticsManager {
  private isEnabled = true;
  private userId = null;
  private sessionId;
  private eventQueue = [];
  private errorQueue = [];
  private performanceQueue = [];
  private userEventQueue = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private isOnline = navigator.onLine;

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
    if (this.isEnabled) return;

    const enhancedEvent = {
      ...event,
      userId: this.userId || undefined,
      timestamp: Date.now(),
    };

    this.eventQueue.push(enhancedEvent);
    this.scheduleFlush();

    // Send to external analytics if available
    this.sendToExternalAnalytics(enhancedEvent);
  }

  // Error Tracking
  trackError(error,
    context?,
    metadata,
    severity: ErrorEvent["severity"] = "medium",
  ) {
    if (this.isEnabled) return;

    const errorEvent = {
      error,
      context,
      userId: this.userId || undefined,
      userAgent: navigator.userAgent,
      url: window.location.href,
      metadata,
      timestamp: Date.now(),
      severity,
    };

    this.errorQueue.push(errorEvent);
    this.scheduleFlush();

    // Send to external error tracking
    this.sendToExternalErrorTracking(errorEvent);

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Analytics Error, errorEvent);
    }
  }

  // Performance Tracking
  trackPerformance(name,
    duration,
    metadata,
  ) {
    if (this.isEnabled) return;

    const performanceEvent = {
      name,
      duration,
      startTime: performance.now() - duration,
      endTime: performance.now(),
      metadata,
      timestamp: Date.now(),
    };

    this.performanceQueue.push(performanceEvent);
    this.scheduleFlush();
  }

  // User Action Tracking
  trackUserAction(action,
    entity?,
    entityId?,
    metadata,
  ) {
    if (this.isEnabled || this.userId) return;

    const userEvent = {
      userId: this.userId,
      action,
      entity,
      entityId,
      metadata,
      timestamp: Date.now(),
    };

    this.userEventQueue.push(userEvent);
    this.scheduleFlush();
  }

  // Page View Tracking
  trackPageView(page, title?, metadata) {
    this.track({
      event,
      category: "navigation",
      action: "view",
      label,
      metadata: {
        title,
        ...metadata,
      },
    });
  }

  // Complaint System Specific Events
  trackComplaintEvent(action,
    complaintId?,
    metadata,
  ) {
    this.track({
      event,
      category: "complaints",
      action,
      label,
      metadata,
    });

    this.trackUserAction(action, "complaint", complaintId, metadata);
  }

  trackAuthEvent(action,
    method?,
    metadata,
  ) {
    this.track({
      event,
      category: "authentication",
      action,
      label,
      metadata,
    });
  }

  trackFormEvent(action,
    formName,
    metadata,
  ) {
    this.track({
      event,
      category: "forms",
      action,
      label,
      metadata,
    });
  }

  trackSearchEvent(query,
    results,
    metadata,
  ) {
    this.track({
      event,
      category: "search",
      action: "query",
      label,
      value,
      metadata,
    });
  }

  // Private methods
  private generateSessionId() {
    return (
      "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  private initializeFlushInterval() {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30000); // Flush every 30 seconds
  }

  private scheduleFlush() {
    // Flush immediately if queues are getting large
    const totalEvents =
      this.eventQueue.length +
      this.errorQueue.length +
      this.performanceQueue.length +
      this.userEventQueue.length;

    if (totalEvents >= 10) {
      this.flush();
    }
  }

  private async flush() {
    if (this.isOnline) return;

    const events = [...this.eventQueue];
    const errors = [...this.errorQueue];
    const performance = [...this.performanceQueue];
    const userEvents = [...this.userEventQueue];

    // Clear queues
    this.eventQueue = [];
    this.errorQueue = [];
    this.performanceQueue = [];
    this.userEventQueue = [];

    if (
      events.length === 0 &&
      errors.length === 0 &&
      performance.length === 0 &&
      userEvents.length === 0
    ) {
      return;
    }

    try {
      await this.sendToServer({
        sessionId,
        events,
        errors,
        performance,
        userEvents,
        timestamp: Date.now(),
      });
    } catch (error) {
      // Put events back in queue if sending failed
      this.eventQueue.unshift(...events);
      this.errorQueue.unshift(...errors);
      this.performanceQueue.unshift(...performance);
      this.userEventQueue.unshift(...userEvents);

      console.warn("Failed to send analytics data, error);
    }
  }

  private async sendToServer(data) {
    const response = await fetch("/api/analytics", {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      throw new Error(`Analytics server responded with ${response.status}`);
    }
  }

  private sendToExternalAnalytics(event) {
    // Google Analytics 4
    if (window.gtag) {
      window.gtag("event", event.action, {
        event_category,
        event_label: event.label,
        value: event.value,
        custom_parameter_1: event.metadata?.source,
        custom_parameter_2: event.metadata?.feature,
      });
    }
  }

  private sendToExternalErrorTracking(error) {
    // Sentry
    if (window.Sentry) {
      window.Sentry.captureException(error.error, {
        tags,
          severity: error.severity,
        },
        extra: error.metadata,
        user: {
          id: error.userId,
        },
      });
    }
  }

  private setupOnlineStatusListener() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.flush(); // Flush queued events when back online
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
    });
  }

  private setupUnloadListener() {
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

  private setupPerformanceObserver() {
    if ("PerformanceObserver" in window) {
      // Track Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];

        this.trackPerformance("lcp", lastEntry.startTime, {
          element,
          url: lastEntry.url,
        });
      });

      lcpObserver.observe({ entryTypes);

      // Track First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.trackPerformance("fid",
            entry.processingStart - entry.startTime,
            {
              eventType,
            },
          );
        });
      });

      fidObserver.observe({ entryTypes);

      // Track Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }

        this.trackPerformance("cls", clsValue);
      });

      clsObserver.observe({ entryTypes);
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
export function withPageTracking(Component,
  pageName,
) {
  return function TrackedComponent(props) {
    React.useEffect(() => {
      analytics.trackPageView(pageName);
    }, []);

    return React.createElement(Component, props);
  };
}

// Error boundary with analytics
export class AnalyticsErrorBoundary extends React.Component;
  },
  { hasError; error: Error | null }
> {
  constructor(props) {
    super(props);
    this.state = { hasError, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError, error };
  }

  componentDidCatch(error, errorInfo) {
    analytics.trackError(error,
      "react_error_boundary",
      {
        componentStack,
        errorBoundary,
      },
      "high",
    );
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback;
      return Fallback
        ? React.createElement(Fallback, { error)
        : React.createElement("div", {}, "Something went wrong.");
    }

    return this.props.children;
  }
}

// Type declarations for external services
declare global {
  ;
  }
}

export default analytics;
