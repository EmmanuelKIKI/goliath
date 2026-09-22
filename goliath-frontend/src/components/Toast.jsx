// src/components/Toast.jsx
import { CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react";
import { useToast } from "../hooks/useToast.jsx";

const VARIANT_STYLES = {
  success: { icon: CheckCircle2, className: "bg-forest text-white" },
  warning: { icon: AlertTriangle, className: "bg-warning text-white" },
  error: { icon: XCircle, className: "bg-danger text-white" },
};

export default function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[90%] max-w-sm">
      {toasts.map((toast) => {
        const { icon: Icon, className } = VARIANT_STYLES[toast.variant] ?? VARIANT_STYLES.success;
        return (
          <div
            key={toast.id}
            role="status"
            className={`flex items-center gap-2 rounded-md px-4 py-3 shadow-lg ${className}`}
          >
            <Icon size={18} className="shrink-0" />
            <p className="text-sm flex-1">{toast.message}</p>
            <button
              onClick={() => dismissToast(toast.id)}
              aria-label="Fermer la notification"
              className="opacity-80 hover:opacity-100"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
