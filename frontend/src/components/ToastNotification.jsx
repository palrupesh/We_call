import { useEffect } from "react";
import "./ToastNotification.css";

// Helper function to get icon based on notification type
const getIconForType = (type) => {
  switch (type) {
    // New unified types
    case "error":
      return "❌";
    case "warning":
      return "⚠️";
    case "info":
      return "ℹ️";
    case "success":
      return "✅";
    // Existing socket notification types
    case "contact_request":
      return "👤";
    case "contact_accepted":
      return "✅";
    case "missed_call":
      return "📞";
    case "system":
      return "ℹ️";
    default:
      return "🔔";
  }
};

// Helper function to format notification type for display
const formatNotificationType = (type) => {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

function ToastNotification({ type, title, message, duration = 4000, onClose }) {
  useEffect(() => {
    // Auto-dismiss based on duration (0 = no auto-dismiss for persistent toasts)
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  // Determine the CSS class for the toast type
  const toastClass = `toast-notification ${type || ""}`;

  // Get display title (use provided title or format from type)
  const displayTitle = title || formatNotificationType(type);

  return (
    <div className={toastClass}>
      <div className="toast-icon">{getIconForType(type)}</div>
      <div className="toast-content">
        <strong>{displayTitle}</strong>
        <p>{message}</p>
      </div>
      <button className="toast-close" onClick={onClose} aria-label="Close notification">
        ×
      </button>
    </div>
  );
}

export default ToastNotification;
