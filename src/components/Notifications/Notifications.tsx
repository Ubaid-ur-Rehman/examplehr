"use client";

import { useEffect, useMemo, useState } from "react";

import { useAppStore } from "@/lib/store";

const AUTO_DISMISS_MS = 5_000;
const EXIT_ANIMATION_MS = 250;

const NOTIFICATION_STYLES = {
  success: {
    icon: "✓",
    className: "border-emerald-200 bg-emerald-50 text-emerald-900",
    iconClassName: "bg-emerald-600 text-white",
  },
  error: {
    icon: "✗",
    className: "border-red-200 bg-red-50 text-red-900",
    iconClassName: "bg-red-600 text-white",
  },
  warning: {
    icon: "⚠",
    className: "border-amber-200 bg-amber-50 text-amber-900",
    iconClassName: "bg-amber-500 text-white",
  },
  info: {
    icon: "ℹ",
    className: "border-blue-200 bg-blue-50 text-blue-900",
    iconClassName: "bg-blue-600 text-white",
  },
} as const;

export function Notifications() {
  const notifications = useAppStore((state) => state.notifications);
  const removeNotification = useAppStore((state) => state.removeNotification);
  const [exitingIds, setExitingIds] = useState<string[]>([]);

  const exitingIdSet = useMemo(() => new Set(exitingIds), [exitingIds]);

  useEffect(() => {
    const timers = notifications.map((notification) =>
      window.setTimeout(() => {
        setExitingIds((current) =>
          current.includes(notification.id)
            ? current
            : [...current, notification.id],
        );

        window.setTimeout(() => {
          removeNotification(notification.id);
          setExitingIds((current) =>
            current.filter((id) => id !== notification.id),
          );
        }, EXIT_ANIMATION_MS);
      }, AUTO_DISMISS_MS),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [notifications, removeNotification]);

  function dismissNotification(id: string) {
    setExitingIds((current) => (current.includes(id) ? current : [...current, id]));

    window.setTimeout(() => {
      removeNotification(id);
      setExitingIds((current) => current.filter((item) => item !== id));
    }, EXIT_ANIMATION_MS);
  }

  if (!notifications.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3">
      {notifications.map((notification) => {
        const style = NOTIFICATION_STYLES[notification.type];
        const isExiting = exitingIdSet.has(notification.id);

        return (
          <div
            key={notification.id}
            className={`pointer-events-auto rounded-2xl border p-4 shadow-lg transition-all duration-300 ${
              style.className
            } ${
              isExiting
                ? "translate-x-4 opacity-0"
                : "translate-x-0 opacity-100"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={`mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${style.iconClassName}`}
              >
                {style.icon}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-6">{notification.message}</p>
              </div>

              <button
                aria-label="Close notification"
                className="rounded-md px-2 py-1 text-sm font-medium text-current/70 transition hover:bg-black/5 hover:text-current"
                type="button"
                onClick={() => dismissNotification(notification.id)}
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Notifications;
