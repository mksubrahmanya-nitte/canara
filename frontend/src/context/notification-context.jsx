import { createContext, useContext, useState, useCallback } from "react";

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, options = {}) => {
    const id = Math.random().toString(36).substring(2, 9);
    const notification = {
      id,
      message,
      type: options.type || "info",
      title: options.title,
      duration: options.duration,
    };

    setNotifications((prev) => [...prev, notification]);

    // Auto-remove notification after duration
    if (notification.duration) {
      setTimeout(() => removeNotification(id), notification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const addSuccess = useCallback(
    (message, options = {}) => addNotification(message, { type: "success", ...options }),
    [addNotification]
  );

  const addError = useCallback(
    (message, options = {}) => addNotification(message, { type: "error", ...options }),
    [addNotification]
  );

  const addWarning = useCallback(
    (message, options = {}) => addNotification(message, { type: "warning", ...options }),
    [addNotification]
  );

  const addInfo = useCallback(
    (message, options = {}) => addNotification(message, { type: "info", ...options }),
    [addNotification]
  );

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    addSuccess,
    addError,
    addWarning,
    addInfo,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
};
