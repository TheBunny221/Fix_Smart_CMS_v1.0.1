/**
 * Global Message Handler Component
 * 
 * This component handles the display of global messages including:
 * - Toast notifications from the notification system
 * - Modal dialogs for confirmations and alerts
 * - Automatic cleanup of displayed messages
 */

import React, { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { 
  selectNotifications, 
  removeNotification,
  clearNotifications 
} from "../store/slices/ui";
import { useToast } from "../hooks/use-toast";

const GlobalMessageHandler = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const { toast } = useToast();

  // Handle notifications using shadcn/ui toast system
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      notifications.forEach((notification) => {
        // Show the toast notification
        toast({
          title: notification.title || "Notification",
          description: notification.message,
          variant: notification.type === "error" ? "destructive" : "default",
          duration: notification.duration || 5000,
        });

        // Remove from store after showing (with a small delay to prevent flashing)
        setTimeout(() => {
          dispatch(removeNotification(notification.id));
        }, 100);
      });
    }
  }, [notifications, toast, dispatch]);

  // Auto-cleanup old notifications (older than 10 seconds)
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      const oldNotifications = notifications.filter(notification => {
        const age = now - (notification.timestamp || 0);
        return age > 10000; // 10 seconds
      });

      if (oldNotifications.length > 0) {
        oldNotifications.forEach(notification => {
          dispatch(removeNotification(notification.id));
        });
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(cleanup);
  }, [notifications, dispatch]);

  // This component doesn't render anything visible - it just handles side effects
  return null;
};

export default GlobalMessageHandler;
