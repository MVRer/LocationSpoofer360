import { useStore } from "../../store";

export function ToastContainer() {
  const toasts = useStore((s) => s.toasts);
  const removeToast = useStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-14 right-4 z-[20000] flex flex-col gap-1.5">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-3.5 py-2 rounded-md text-xs cursor-pointer max-w-[350px] shadow-lg animate-[slideIn_0.2s_ease] ${
            t.type === "error"
              ? "bg-red-950 border border-red-500 text-red-300"
              : t.type === "success"
                ? "bg-green-950 border border-green-500 text-green-300"
                : "bg-slate-800 border border-blue-500 text-slate-200"
          }`}
          onClick={() => removeToast(t.id)}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
