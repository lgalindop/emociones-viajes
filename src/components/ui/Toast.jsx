import { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { CheckCircle, AlertTriangle, Info, X } from "lucide-react";

export default function Toast({
  message,
  type = "success",
  duration = 3000,
  onClose,
}) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="text-green-500" size={20} aria-hidden="true" />,
    error: <AlertTriangle className="text-red-500" size={20} aria-hidden="true" />,
    warning: <AlertTriangle className="text-yellow-500" size={20} aria-hidden="true" />,
    info: <Info className="text-blue-500" size={20} aria-hidden="true" />,
  };

  const bgColors = {
    success: "bg-green-50 border-green-200",
    error: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
    info: "bg-blue-50 border-blue-200",
  };

  return (
    <div
      className={`fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg transition-all duration-300 ${
        bgColors[type]
      } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}`}
      role="alert"
      aria-live="polite"
    >
      {icons[type]}
      <span className="text-sm text-gray-700">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="text-gray-400 hover:text-gray-600 ml-2"
        aria-label="Cerrar notificación"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["success", "error", "warning", "info"]),
  duration: PropTypes.number,
  onClose: PropTypes.func.isRequired,
};

// Toast container for managing multiple toasts
export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

ToastContainer.propTypes = {
  toasts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      message: PropTypes.string.isRequired,
      type: PropTypes.oneOf(["success", "error", "warning", "info"]),
      duration: PropTypes.number,
    })
  ).isRequired,
  removeToast: PropTypes.func.isRequired,
};

// Hook for using toasts
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success", duration = 3000) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
