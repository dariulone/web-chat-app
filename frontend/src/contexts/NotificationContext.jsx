import React, { createContext, useState, useContext, useCallback } from "react";

const NotificationContext = createContext();

export const useNotificationContext = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Обновление уведомлений
  const updateNotifications = useCallback((newNotifications) => {
    setNotifications(newNotifications);
  }, []);

  // Очистка уведомлений
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        notificationCount: notifications.length,
        updateNotifications,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
