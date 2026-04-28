import { create } from "zustand";

import type { Notification } from "@/types";

interface AppStore {
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  pendingRequests: string[];
  addPendingRequest: (id: string) => void;
  removePendingRequest: (id: string) => void;
  rolledBackRequests: string[];
  addRolledBackRequest: (id: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, notification],
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter(
        (notification) => notification.id !== id,
      ),
    })),
  pendingRequests: [],
  addPendingRequest: (id) =>
    set((state) => ({
      pendingRequests: state.pendingRequests.includes(id)
        ? state.pendingRequests
        : [...state.pendingRequests, id],
    })),
  removePendingRequest: (id) =>
    set((state) => ({
      pendingRequests: state.pendingRequests.filter(
        (requestId) => requestId !== id,
      ),
    })),
  rolledBackRequests: [],
  addRolledBackRequest: (id) =>
    set((state) => ({
      rolledBackRequests: state.rolledBackRequests.includes(id)
        ? state.rolledBackRequests
        : [...state.rolledBackRequests, id],
    })),
}));
