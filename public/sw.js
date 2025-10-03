/**
 * Service Worker for Push Notifications
 * Version: 1.0.0
 *
 * Handles push events from NotificationAPI and displays notifications
 * with proper click handling and focus management.
 */

const SW_VERSION = "1.0.0";
const NOTIFICATION_DEFAULTS = {
  icon: "/icon-192.png",
  badge: "/badge-72.png",
  vibrate: [200, 100, 200],
  requireInteraction: false,
  tag: "bloom-notification"
};

// Install event - activate immediately
self.addEventListener("install", (event) => {
  console.log(`[SW ${SW_VERSION}] Installing...`);
  self.skipWaiting(); // Activate immediately
});

// Activate event - take control immediately
self.addEventListener("activate", (event) => {
  console.log(`[SW ${SW_VERSION}] Activating...`);
  event.waitUntil(
    self.clients.claim() // Take control of all pages immediately
  );
});

// Push event - receive and display notification
self.addEventListener("push", (event) => {
  console.log(`[SW ${SW_VERSION}] Push received`);

  if (!event.data) {
    console.warn("[SW] Push event has no data");
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (error) {
    console.error("[SW] Failed to parse push data:", error);
    notificationData = {
      title: "New Update",
      body: event.data.text() || "You have a new notification"
    };
  }

  // Extract notification fields
  // NotificationAPI format: { title, body, icon, badge, data, ... }
  const {
    title = "Bloom Matchmaker",
    body = message || description || "You have a new update",
    message,
    description,
    icon,
    badge,
    tag,
    requireInteraction,
    actions,
    url,
    data = {}
  } = notificationData;

  const notificationOptions = {
    body,
    icon: icon || NOTIFICATION_DEFAULTS.icon,
    badge: badge || NOTIFICATION_DEFAULTS.badge,
    vibrate: NOTIFICATION_DEFAULTS.vibrate,
    tag: tag || NOTIFICATION_DEFAULTS.tag,
    requireInteraction: requireInteraction !== undefined ? requireInteraction : NOTIFICATION_DEFAULTS.requireInteraction,
    data: {
      url: url || data.url || data.redirect_url || "/client/dashboard",
      ...data
    }
  };

  // Add action buttons if provided
  if (actions && Array.isArray(actions)) {
    notificationOptions.actions = actions;
  }

  const promiseChain = self.registration.showNotification(
    title,
    notificationOptions
  );

  event.waitUntil(promiseChain);
});

// Notification click event - handle navigation
self.addEventListener("notificationclick", (event) => {
  console.log(`[SW ${SW_VERSION}] Notification clicked`);

  event.notification.close();

  // Get the URL from notification data
  const urlToOpen = event.notification.data?.url || "/client/dashboard";
  const fullUrl = new URL(urlToOpen, self.location.origin).href;

  // Handle action clicks
  if (event.action) {
    console.log(`[SW] Action clicked: ${event.action}`);
    // Handle specific actions if needed
    // For now, just navigate to the URL
  }

  // Try to focus existing window or open new one
  const promiseChain = clients
    .matchAll({
      type: "window",
      includeUncontrolled: true
    })
    .then((windowClients) => {
      // Check if there's already a window open with this URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === fullUrl && "focus" in client) {
          return client.focus();
        }
      }

      // If no matching window, check for any window to focus and navigate
      if (windowClients.length > 0) {
        const client = windowClients[0];
        if ("navigate" in client) {
          client.navigate(fullUrl);
          return client.focus();
        }
      }

      // No existing window, open new one
      if (clients.openWindow) {
        return clients.openWindow(fullUrl);
      }
    })
    .catch((error) => {
      console.error("[SW] Error handling notification click:", error);
    });

  event.waitUntil(promiseChain);
});

// Handle notification close event (optional - for analytics)
self.addEventListener("notificationclose", (event) => {
  console.log(`[SW ${SW_VERSION}] Notification closed`, event.notification.tag);
  // Could send analytics event here
});

// Message event - handle messages from clients
self.addEventListener("message", (event) => {
  console.log(`[SW ${SW_VERSION}] Message received:`, event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.ports[0].postMessage({ version: SW_VERSION });
  }
});

console.log(`[SW ${SW_VERSION}] Service Worker loaded`);
