import React, { createContext, useContext, useState } from 'react';

export type TabKey = 'home' | 'announcements' | 'events' | 'profile';

interface NotificationContextType {
  unreadCounts: Record<TabKey, number>;
  incrementUnread: (tab: TabKey) => void;
  clearUnread: (tab: TabKey) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCounts, setUnreadCounts] = useState<Record<TabKey, number>>({
    home: 0,
    announcements: 0,
    events: 0,
    profile: 0,
  });

  const incrementUnread = (tab: TabKey) => {
    setUnreadCounts((prev) => ({ ...prev, [tab]: prev[tab] + 1 }));
  };

  const clearUnread = (tab: TabKey) => {
    setUnreadCounts((prev) => ({ ...prev, [tab]: 0 }));
  };

  return (
    <NotificationContext.Provider value={{ unreadCounts, incrementUnread, clearUnread }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the context easily
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};