// OMNI Notification & Alarm Service
// Supports native Web Notifications API + Audio Chimes + Haptic Vibrations + In-App Toasts

import { sound } from "./sound";
import { vibrate } from "./utils";

export interface OmniNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
}

export type NotificationPermissionState = "default" | "granted" | "denied";

class NotificationManager {
  private inAppSubscribers: ((notif: { title: string; body: string; id: string; type?: string }) => void)[] = [];

  // Request browser permission for system notifications
  async requestPermission(): Promise<NotificationPermissionState> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "denied";
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.warn("Notification request permission error:", e);
      return "denied";
    }
  }

  getPermissionState(): NotificationPermissionState {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "denied";
    }
    return Notification.permission;
  }

  // Subscribe to in-app banners/toasts
  subscribeInApp(cb: (notif: { title: string; body: string; id: string; type?: string }) => void) {
    this.inAppSubscribers.push(cb);
    return () => {
      this.inAppSubscribers = this.inAppSubscribers.filter((s) => s !== cb);
    };
  }

  // Trigger high-priority notification (Focus completion, Alarm, Daily Routine)
  notify(options: OmniNotificationOptions) {
    const id = Date.now().toString();

    // 1. Play auditory chime
    sound.playNotification();

    // 2. Play haptic vibration pattern
    vibrate([80, 50, 80, 50, 150]);

    // 3. Dispatch to all active in-app toast listeners
    this.inAppSubscribers.forEach((cb) => {
      cb({
        title: options.title,
        body: options.body,
        id,
      });
    });

    // 4. Send native OS / browser notification if allowed
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        try {
          new Notification(options.title, {
            body: options.body,
            icon: options.icon || "/icons/icon-192.png",
            tag: options.tag || "omni-alert",
          });
        } catch (e) {
          // In sandboxed environments or specific mobile webviews
          console.warn("Could not dispatch native Notification:", e);
        }
      }
    }
  }

  // Trigger Alarm Ring (Repeating chime + strong vibrations)
  ringAlarm(label: string, durationSec = 10) {
    this.notify({
      title: `⏰ Réveil OMNI : ${label}`,
      body: "C'est l'heure ! Démarre ta routine pour maximiser ton focus et tes points OMNI.",
      tag: "omni-alarm",
    });

    let count = 0;
    const interval = setInterval(() => {
      sound.playSuccess();
      vibrate([100, 80, 100]);
      count++;
      if (count >= 5) {
        clearInterval(interval);
      }
    }, 1200);
  }
}

export const notificationService = new NotificationManager();
