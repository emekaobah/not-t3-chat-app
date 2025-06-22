import { create } from "zustand";
import * as React from "react";

const MAX_GUEST_MESSAGES = 3;

// Generate semi-persistent browser fingerprint
const generateBrowserFingerprint = () => {
  if (typeof window === "undefined") return "";

  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillText("Browser fingerprint", 2, 2);
    }

    return btoa(
      JSON.stringify({
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        canvas: canvas.toDataURL(),
        userAgent: navigator.userAgent.slice(0, 100),
      })
    );
  } catch (e) {
    // Fallback fingerprint if canvas fails
    return btoa(
      JSON.stringify({
        screen: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        userAgent: navigator.userAgent.slice(0, 100),
      })
    );
  }
};

// Check if stored count has expired (24 hours)
const isCountExpired = (timestamp: number): boolean => {
  const RESET_HOURS = 24;
  return Date.now() - timestamp > RESET_HOURS * 60 * 60 * 1000;
};

// Get cookie value helper
const getCookieValue = (name: string): string | null => {
  if (typeof document === "undefined") return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
};

// Store count in multiple places for bypass prevention
const storeMessageCount = (count: number, fingerprint: string) => {
  if (typeof window === "undefined") return;

  const data = { count, timestamp: Date.now(), fingerprint };

  try {
    // Multiple storage locations
    localStorage.setItem("guestMsgCount", JSON.stringify(data));
    sessionStorage.setItem("guestMsgCount", JSON.stringify(data));
    localStorage.setItem("_app_state", JSON.stringify(data));
    document.cookie = `gmc=${count}; path=/; max-age=86400`; // 24 hours
  } catch (e) {
    console.warn("Failed to store message count:", e);
  }
};

// Get the most recent count from multiple storage locations
const getStoredMessageCount = (fingerprint: string): number => {
  if (typeof window === "undefined") return 0;

  console.log(
    "🔍 Checking storage for fingerprint:",
    fingerprint.slice(0, 20) + "..."
  );

  try {
    // Check multiple storage locations
    const sources = [
      localStorage.getItem("guestMsgCount"),
      localStorage.getItem("_app_state"),
      sessionStorage.getItem("guestMsgCount"),
    ];

    let maxCount = 0;

    sources.forEach((source, index) => {
      const storageNames = [
        "localStorage.guestMsgCount",
        "localStorage._app_state",
        "sessionStorage.guestMsgCount",
      ];
      console.log(`📦 Checking ${storageNames[index]}:`, source);

      try {
        if (source) {
          const data = JSON.parse(source);
          console.log(`📊 Parsed data from ${storageNames[index]}:`, data);

          // Verify fingerprint match and data freshness
          if (
            data.fingerprint === fingerprint &&
            !isCountExpired(data.timestamp)
          ) {
            console.log(
              `✅ Valid data from ${storageNames[index]}, count:`,
              data.count
            );
            if (data.count > maxCount) {
              maxCount = data.count;
            }
          } else {
            console.log(
              `❌ Invalid/expired data from ${storageNames[index]}:`,
              {
                fingerprintMatch: data.fingerprint === fingerprint,
                expired: isCountExpired(data.timestamp),
              }
            );
          }
        }
      } catch (e) {
        console.warn(`⚠️ Failed to parse ${storageNames[index]}:`, e);
      }
    });

    // Cookie fallback
    const cookieCount = getCookieValue("gmc");
    console.log("🍪 Cookie count:", cookieCount);
    if (cookieCount && parseInt(cookieCount) > maxCount) {
      maxCount = parseInt(cookieCount);
    }

    const finalCount = Math.min(maxCount, MAX_GUEST_MESSAGES);
    console.log("🎯 Final stored count:", finalCount);
    return finalCount;
  } catch (e) {
    console.warn("Failed to get stored message count:", e);
    return 0;
  }
};

interface GuestMessageStore {
  // State
  messageCount: number;
  isLimitReached: boolean;
  isInitialized: boolean;
  fingerprint: string;

  // Reactive computed values (not getters)
  remainingMessages: number;
  canSendMessage: boolean;

  // Actions
  initializeCount: () => void;
  incrementCount: () => number;
  resetCount: () => void;
  resetOnSignIn: () => void;
  forceReinitialize: () => void; // New function to force reinitialization
  clearAllStorage: () => void; // DEBUG function
  _updateComputedValues: () => void; // Internal helper
}

export const useGuestMessageStore = create<GuestMessageStore>((set, get) => ({
  // Initial state
  messageCount: 0,
  isLimitReached: false,
  isInitialized: false,
  fingerprint: "",

  // Reactive computed values (not getters)
  remainingMessages: MAX_GUEST_MESSAGES,
  canSendMessage: true,

  // Internal helper to update computed values
  _updateComputedValues: () => {
    const state = get();
    set({
      remainingMessages: MAX_GUEST_MESSAGES - state.messageCount,
      canSendMessage: state.messageCount < MAX_GUEST_MESSAGES,
      isLimitReached: state.messageCount >= MAX_GUEST_MESSAGES,
    });
  },

  // Initialize count from multiple storage locations
  initializeCount: () => {
    if (typeof window === "undefined") return;

    const fingerprint = generateBrowserFingerprint();
    const storedCount = getStoredMessageCount(fingerprint);

    console.log("🔍 Initializing with:", {
      fingerprint: fingerprint.slice(0, 20) + "...",
      storedCount,
    });

    set({
      messageCount: storedCount,
      isLimitReached: storedCount >= MAX_GUEST_MESSAGES,
      remainingMessages: MAX_GUEST_MESSAGES - storedCount,
      canSendMessage: storedCount < MAX_GUEST_MESSAGES,
      isInitialized: true,
      fingerprint,
    });

    // Store session activity
    try {
      sessionStorage.setItem("_recent_activity", Date.now().toString());
    } catch (e) {
      // Ignore storage errors
    }
  },

  // Increment message count
  incrementCount: () => {
    const state = get();

    if (state.messageCount < MAX_GUEST_MESSAGES) {
      const newCount = state.messageCount + 1;

      set({
        messageCount: newCount,
        isLimitReached: newCount >= MAX_GUEST_MESSAGES,
        remainingMessages: MAX_GUEST_MESSAGES - newCount,
        canSendMessage: newCount < MAX_GUEST_MESSAGES,
      });

      // Store in multiple locations
      storeMessageCount(newCount, state.fingerprint);

      return newCount;
    }

    return state.messageCount;
  },

  // Reset count (for testing or special cases)
  resetCount: () => {
    const state = get();

    set({
      messageCount: 0,
      isLimitReached: false,
      remainingMessages: MAX_GUEST_MESSAGES,
      canSendMessage: true,
    });

    storeMessageCount(0, state.fingerprint);
  },

  // Reset count when user signs in
  resetOnSignIn: () => {
    console.log("🧹 Resetting guest message count on sign-in");

    set({
      messageCount: 0,
      isLimitReached: false,
      remainingMessages: MAX_GUEST_MESSAGES,
      canSendMessage: true,
    });

    // Clear all storage locations thoroughly
    try {
      // Clear localStorage
      localStorage.removeItem("guestMsgCount");
      localStorage.removeItem("_app_state");

      // Clear sessionStorage
      sessionStorage.removeItem("guestMsgCount");
      sessionStorage.removeItem("_recent_activity");

      // Clear cookie
      document.cookie = "gmc=0; path=/; max-age=0"; // Delete cookie

      // Also try alternative cookie clearing methods
      document.cookie = "gmc=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";

      console.log("✅ All guest message storage cleared");
    } catch (e) {
      console.warn("⚠️ Failed to clear message count storage:", e);
    }
  }, // Force reinitialization (useful when user signs out)
  forceReinitialize: () => {
    console.log("🔄 Force reinitializing guest message store");

    // Reset to uninitialized state
    set({
      messageCount: 0,
      isLimitReached: false,
      isInitialized: false,
      fingerprint: "",
      remainingMessages: MAX_GUEST_MESSAGES,
      canSendMessage: true,
    });

    // Then reinitialize
    const fingerprint = generateBrowserFingerprint();
    const storedCount = getStoredMessageCount(fingerprint);

    console.log("🔍 Force reinitializing with:", {
      fingerprint: fingerprint.slice(0, 20) + "...",
      storedCount,
    });

    set({
      messageCount: storedCount,
      isLimitReached: storedCount >= MAX_GUEST_MESSAGES,
      remainingMessages: MAX_GUEST_MESSAGES - storedCount,
      canSendMessage: storedCount < MAX_GUEST_MESSAGES,
      isInitialized: true,
      fingerprint,
    });
  },

  // DEBUG: Clear all storage (for testing)
  clearAllStorage: () => {
    console.log("🧹 CLEARING ALL GUEST STORAGE FOR DEBUG");
    try {
      localStorage.removeItem("guestMsgCount");
      localStorage.removeItem("_app_state");
      sessionStorage.removeItem("guestMsgCount");
      sessionStorage.removeItem("_recent_activity");
      document.cookie = "gmc=0; path=/; max-age=0";
      document.cookie = "gmc=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      console.log("✅ All storage cleared");

      // Reset state
      set({
        messageCount: 0,
        isLimitReached: false,
        isInitialized: false,
        fingerprint: "",
        remainingMessages: MAX_GUEST_MESSAGES,
        canSendMessage: true,
      });
    } catch (e) {
      console.error("❌ Failed to clear storage:", e);
    }
  },
}));

// Hook for easy access to the store
export const useGuestMessageLimiter = () => {
  const store = useGuestMessageStore();

  // Initialize on first use with immediate effect
  React.useEffect(() => {
    if (!store.isInitialized && typeof window !== "undefined") {
      console.log("🔄 Initializing guest message store...");
      store.initializeCount();
      console.log("✅ Guest message store initialized:", {
        messageCount: store.messageCount,
        remainingMessages: store.remainingMessages,
        canSendMessage: store.canSendMessage,
      });
    }
  }, [store.isInitialized]);

  // Debug logging for state changes
  React.useEffect(() => {
    console.log("📊 Guest message state update:", {
      messageCount: store.messageCount,
      remainingMessages: store.remainingMessages,
      canSendMessage: store.canSendMessage,
      isLimitReached: store.isLimitReached,
    });
  }, [
    store.messageCount,
    store.remainingMessages,
    store.canSendMessage,
    store.isLimitReached,
  ]);

  return {
    guestMessageCount: store.messageCount,
    remainingMessages: store.remainingMessages,
    isLimitReached: store.isLimitReached,
    isLoading: !store.isInitialized,
    incrementMessageCount: store.incrementCount,
    resetMessageCount: store.resetCount,
    resetOnSignIn: store.resetOnSignIn,
    forceReinitialize: store.forceReinitialize,
    clearAllStorage: store.clearAllStorage, // DEBUG function
    canSendMessage: store.canSendMessage,
    maxMessages: MAX_GUEST_MESSAGES,
  };
};
