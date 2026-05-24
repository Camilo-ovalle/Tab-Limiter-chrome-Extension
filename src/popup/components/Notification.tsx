interface NotificationProps {
  message: string;
  type: "success" | "error" | "info";
}

const styles = {
  success: "bg-emerald-900 border-emerald-700 text-emerald-200",
  error: "bg-red-900 border-red-700 text-red-200",
  info: "bg-blue-900 border-blue-700 text-blue-200",
};

const icons = { success: "✓", error: "✕", info: "ℹ" };

export function Notification({ message, type }: NotificationProps) {
  return (
    <div
      className={`fixed top-2 left-2 right-2 flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium z-50 shadow-lg ${styles[type]}`}
    >
      <span className="font-bold">{icons[type]}</span>
      <span>{message}</span>
    </div>
  );
}
