
import { useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

const ShowToast = ({ message, type = "info", onClose, duration = 3000 }) => {

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const toastStyles = {
    success: {
      icon: <CheckCircle2 size={21} />,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
      title: "Success",
    },

    error: {
      icon: <XCircle size={21} />,
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
      title: "Error",
    },

    warning: {
      icon: <AlertTriangle size={21} />,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
      title: "Warning",
    },

    info: {
      icon: <Info size={21} />,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      title: "Information",
    },
  };

  const style = toastStyles[type] || toastStyles.info;

  return (
    <div
      role="alert"
      className={`fixed right-5 top-5 z-9999 flex w-[calc(100%-40px)] max-w-sm items-start gap-3 rounded-xl border ${style.border} ${style.bg} p-4 shadow-xl animate-in slide-in-from-right-5 fade-in duration-300`}
    >
      {/* Icon */}
      <div className={`${style.color} mt-0.5`}>
        {style.icon}
      </div>

      {/* Message */}
      <div className="min-w-0 flex-1">
        <h3 className={`text-sm font-semibold ${style.color}`}>
          {style.title}
        </h3>

        <p className="mt-1 warp-break-word text-sm text-gray-600">
          {message}
        </p>
      </div>

      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close notification"
        className="shrink-0 text-gray-400 transition-colors hover:text-gray-700"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default ShowToast;
