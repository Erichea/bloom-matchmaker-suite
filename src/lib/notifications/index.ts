/**
 * Notification Service - Web Push via NotificationAPI
 *
 * This module handles:
 * - Service worker registration for push notifications
 * - Permission management (never auto-prompts)
 * - Push subscription management with NotificationAPI
 * - iOS PWA detection and guidance
 *
 * @see https://www.notificationapi.com/docs
 */

import { supabase } from "@/integrations/supabase/client";

const SW_PATH = "/sw.js";
const DEBUG = process.env.NODE_ENV === "development";

interface SubscribeOptions {
  userId: string;
  channels?: ("push" | "email" | "sms")[];
}

interface NotificationPayload {
  action?: "send";
  userId: string;
  templateId?: string;
  payload?: Record<string, any>;
  channels?: ("push" | "email" | "sms")[];
  // Direct web_push support (no template required)
  web_push?: {
    title: string;
    message: string;
    icon?: string;
    url?: string;
  };
}

/**
 * Check if the current environment supports push notifications
 * Includes special handling for iOS PWA requirements (16.4+)
 */
export function isPushSupported(): {
  supported: boolean;
  reason?: string;
  requiresPWA?: boolean;
} {
  // Check basic requirements
  if (!("serviceWorker" in navigator)) {
    return { supported: false, reason: "Service workers not supported" };
  }

  if (!("PushManager" in window)) {
    return { supported: false, reason: "Push notifications not supported" };
  }

  if (!("Notification" in window)) {
    return { supported: false, reason: "Notifications API not available" };
  }

  // iOS-specific checks
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    // Check if running as PWA (standalone mode)
    const isStandalone = (window.navigator as any).standalone === true ||
                        window.matchMedia("(display-mode: standalone)").matches;

    if (!isStandalone) {
      return {
        supported: false,
        reason: "iOS requires app to be installed as PWA",
        requiresPWA: true
      };
    }

    // Check iOS version (need 16.4+)
    const match = navigator.userAgent.match(/OS (\d+)_(\d+)/);
    if (match) {
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      if (major < 16 || (major === 16 && minor < 4)) {
        return {
          supported: false,
          reason: "iOS 16.4 or higher required for push notifications"
        };
      }
    }
  }

  return { supported: true };
}

/**
 * Register the service worker for push notifications
 * Handles updates gracefully
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  const support = isPushSupported();
  if (!support.supported) {
    if (DEBUG) console.debug("[Notifications] Push not supported:", support.reason);
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, {
      scope: "/"
    });

    if (DEBUG) console.debug("[Notifications] Service worker registered");

    // Handle updates
    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (DEBUG) console.debug("[Notifications] Service worker update found");

      newWorker?.addEventListener("statechange", () => {
        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
          if (DEBUG) console.debug("[Notifications] New service worker installed, will activate on next page load");
        }
      });
    });

    return registration;
  } catch (error) {
    console.error("[Notifications] Service worker registration failed:", error);
    return null;
  }
}

/**
 * Request notification permission from the user
 * ONLY call this when user explicitly clicks "Enable Notifications"
 * Never call on page load!
 */
export async function ensurePermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    throw new Error("Notifications not supported");
  }

  // Already have permission
  if (Notification.permission === "granted") {
    return "granted";
  }

  // Already denied
  if (Notification.permission === "denied") {
    return "denied";
  }

  // Request permission
  try {
    const permission = await Notification.requestPermission();
    if (DEBUG) console.debug("[Notifications] Permission result:", permission);
    return permission;
  } catch (error) {
    console.error("[Notifications] Permission request failed:", error);
    return "denied";
  }
}

/**
 * Get the current push subscription
 */
async function getSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

/**
 * Subscribe the current device to push notifications
 * Registers with NotificationAPI via Edge Function
 */
export async function subscribeUser(options: SubscribeOptions): Promise<{ success: boolean; error?: string }> {
  const support = isPushSupported();
  if (!support.supported) {
    return { success: false, error: support.reason };
  }

  try {
    // Ensure permission
    const permission = await ensurePermission();
    if (permission !== "granted") {
      return { success: false, error: "Permission denied" };
    }

    // Register service worker
    const registration = await registerServiceWorker();
    if (!registration) {
      return { success: false, error: "Service worker registration failed" };
    }

    // Get or create push subscription
    let subscription = await getSubscription();

    if (!subscription) {
      // Get VAPID public key from Edge Function
      const { data: configData } = await supabase.functions.invoke("notify", {
        body: { action: "get-config" }
      });

      if (!configData?.vapidPublicKey) {
        return { success: false, error: "Failed to get VAPID key" };
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(configData.vapidPublicKey)
      });
    }

    // Register subscription with NotificationAPI
    const { data, error } = await supabase.functions.invoke("notify", {
      body: {
        action: "subscribe",
        userId: options.userId,
        subscription: subscription.toJSON(),
        channels: options.channels || ["push"]
      }
    });

    if (error) {
      console.error("[Notifications] Subscribe failed:", error);
      return { success: false, error: error.message };
    }

    if (DEBUG) console.debug("[Notifications] Subscribed successfully");
    return { success: true };
  } catch (error: any) {
    console.error("[Notifications] Subscribe error:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

/**
 * Unsubscribe from push notifications
 * Call this on logout to cleanup
 */
export async function unsubscribeUser(userId: string): Promise<void> {
  try {
    const subscription = await getSubscription();
    if (subscription) {
      // Unregister from NotificationAPI
      await supabase.functions.invoke("notify", {
        body: {
          action: "unsubscribe",
          userId,
          subscription: subscription.toJSON()
        }
      });

      // Unsubscribe from browser
      await subscription.unsubscribe();
      if (DEBUG) console.debug("[Notifications] Unsubscribed successfully");
    }
  } catch (error) {
    console.error("[Notifications] Unsubscribe error:", error);
  }
}

/**
 * Send a test push notification (dev/testing only)
 */
export async function sendTestPush(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("notify", {
      body: {
        action: "send",
        userId,
        web_push: {
          title: "Test Notification 🔔",
          message: "This is a test push notification from Bloom Matchmaker!",
          icon: window.location.origin + "/icon-192.png",
          url: window.location.origin + "/client/dashboard"
        },
        channels: ["push"]
      } as NotificationPayload
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (DEBUG) console.debug("[Notifications] Test push sent");
    return { success: true };
  } catch (error: any) {
    console.error("[Notifications] Test push error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get current notification permission status
 */
export function getPermissionStatus(): NotificationPermission {
  if (!("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
}

/**
 * Check if user is currently subscribed to push
 */
export async function isSubscribed(): Promise<boolean> {
  try {
    const subscription = await getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}

// Utility: Convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
