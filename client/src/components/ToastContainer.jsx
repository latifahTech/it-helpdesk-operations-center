export default function ToastContainer({ toasts }) {
  return (
    <div className="toast-wrap">
      {/* Render active notification toasts */}
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.err ? 'err' : ''}`}>{t.msg}</div>
      ))}
    </div>
  );
}