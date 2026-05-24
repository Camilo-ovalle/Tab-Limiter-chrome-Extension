interface NotificationProps {
  message: string;
  type: "success" | "error" | "info";
}

const styles = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-700",
  error: "bg-red-50 border-red-200 text-red-600",
  info: "bg-[var(--primary-300)] border-[var(--primary-200)] text-[var(--accent-200)]",
};

const icons = { success: "✓", error: "✕", info: "ℹ" };

export function Notification({ message, type }: NotificationProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`fixed top-2 left-2 right-2 flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs font-medium z-50 shadow-md slide-in ${styles[type]}`}
    >
      <span className="font-bold text-sm leading-none" aria-hidden="true">
        {icons[type]}
      </span>
      <span className="tracking-wide">{message}</span>
    </div>
  );
}
