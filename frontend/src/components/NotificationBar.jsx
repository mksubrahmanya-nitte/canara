import { AlertCircle, CheckCircle, Info, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

const NotificationBar = ({ notifications = [], onRemove = () => {} }) => {
  const [displayedNotifications, setDisplayedNotifications] = useState(notifications);

  useEffect(() => {
    setDisplayedNotifications(notifications);
  }, [notifications]);

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle size={18} className="text-emerald-400" />;
      case "error":
        return <XCircle size={18} className="text-red-400" />;
      case "warning":
        return <AlertCircle size={18} className="text-yellow-400" />;
      case "info":
      default:
        return <Info size={18} className="text-blue-400" />;
    }
  };

  const getBgColor = (type) => {
    switch (type) {
      case "success":
        return "bg-emerald-500/10 border-emerald-500/30";
      case "error":
        return "bg-red-500/10 border-red-500/30";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/30";
      case "info":
      default:
        return "bg-blue-500/10 border-blue-500/30";
    }
  };

  const getTextColor = (type) => {
    switch (type) {
      case "success":
        return "text-emerald-300";
      case "error":
        return "text-red-300";
      case "warning":
        return "text-yellow-300";
      case "info":
      default:
        return "text-blue-300";
    }
  };

  if (displayedNotifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {displayedNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`flex items-start gap-3 rounded-xl border p-4 ${getBgColor(notification.type)}`}
        >
          <div className="mt-0.5 flex-shrink-0">{getIcon(notification.type)}</div>
          <div className="flex-1 min-w-0">
            {notification.title && (
              <p className={`font-semibold ${getTextColor(notification.type)}`}>
                {notification.title}
              </p>
            )}
            <p className="text-sm text-slate-300 mt-1">{notification.message}</p>
          </div>
          <button
            onClick={() => onRemove(notification.id)}
            className="flex-shrink-0 text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close notification"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationBar;
