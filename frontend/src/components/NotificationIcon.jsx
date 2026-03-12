import { Bell, X } from "lucide-react";
import { useState } from "react";
import { useNotification } from "../context/notification-context.jsx";

const NotificationIcon = () => {
  const { notifications, removeNotification } = useNotification();
  const [isOpen, setIsOpen] = useState(false);

  const notificationCount = notifications.length;

  const getNotificationColor = (type) => {
    switch (type) {
      case "success":
        return "border-l-emerald-400";
      case "error":
        return "border-l-red-400";
      case "warning":
        return "border-l-yellow-400";
      case "info":
      default:
        return "border-l-blue-400";
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} className="text-slate-300" />
        {notificationCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {notificationCount > 9 ? "9+" : notificationCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-lg z-50">
          <div className="border-b border-slate-700 p-4 flex justify-between items-center">
            <h3 className="font-semibold text-white">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              <X size={18} />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notificationCount === 0 ? (
              <div className="p-4 text-center text-slate-400 text-sm">
                No notifications yet
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-l-4 ${getNotificationColor(
                      notification.type
                    )} bg-slate-800/50 rounded p-3 flex justify-between items-start gap-2`}
                  >
                    <div className="flex-1 min-w-0">
                      {notification.title && (
                        <p className="font-semibold text-sm text-white">
                          {notification.title}
                        </p>
                      )}
                      <p className="text-sm text-slate-300 leading-tight">
                        {notification.message}
                      </p>
                    </div>
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="flex-shrink-0 text-slate-400 hover:text-slate-200 transition-colors"
                      aria-label="Dismiss notification"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationIcon;
